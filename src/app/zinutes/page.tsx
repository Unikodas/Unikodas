import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { ReportButton } from '@/components/ReportButton';
import { LogoLink } from '@/components/LogoLink';
import { ReplyButton } from './ReplyButton';

const PAGE_SIZE = 50;

type MessageRow = {
  id: string;
  listing_id: string | null;
  wanted_listing_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

type PublicProfile = {
  id: string;
  display_name: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Basic inbox: flat chronological list of messages where the user is
 * sender or recipient. RLS `messages_participant_read` already filters
 * the result set to the user's conversations; the explicit query just
 * orders and limits.
 *
 * Counterparty display names come from the public_profiles view in a
 * separate roundtrip, since profiles itself is locked down to own-row
 * reads only.
 */
export default async function InboxPage() {
  const { supabase, user } = await requireUser('/zinutes');

  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('id, listing_id, wanted_listing_id, sender_id, recipient_id, body, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (msgError) {
    console.error('[zinutes] messages fetch failed:', msgError);
  }
  const rows = (msgData ?? []) as MessageRow[];

  // Collect counterparty IDs and look up display names via public_profiles.
  const otherIds = new Set<string>();
  for (const m of rows) {
    if (m.sender_id !== user.id) otherIds.add(m.sender_id);
    if (m.recipient_id !== user.id) otherIds.add(m.recipient_id);
  }
  const displayNames = new Map<string, string>();
  if (otherIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('public_profiles')
      .select('id, display_name')
      .in('id', Array.from(otherIds));
    if (profilesError) {
      console.error('[zinutes] profiles fetch failed:', profilesError);
    }
    for (const p of (profiles ?? []) as PublicProfile[]) {
      if (p.display_name) displayNames.set(p.id, p.display_name);
    }
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">{lt.messages.title}</h1>

        {rows.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{lt.messages.empty}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((m) => {
              const isSent = m.sender_id === user.id;
              const otherId = isSent ? m.recipient_id : m.sender_id;
              const otherName = displayNames.get(otherId) ?? lt.messages.unknownUser;
              const directionLabel = isSent
                ? `${lt.messages.sentTo}: ${otherName}`
                : `${lt.messages.receivedFrom}: ${otherName}`;

              return (
                <li
                  key={m.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2 text-xs text-slate-500">
                    <span
                      className={
                        isSent
                          ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700'
                          : 'inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }
                    >
                      {directionLabel}
                    </span>
                    <span>{formatDate(m.created_at)}</span>
                  </div>

                  <p className="whitespace-pre-wrap text-slate-800 mb-2">{m.body}</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Only the recipient can reply / report — those
                        actions don't make sense on outgoing messages. */}
                    {!isSent && <ReplyButton messageId={m.id} />}
                    {m.listing_id && (
                      <Link
                        href={`/skelbimas/${m.listing_id}`}
                        className="text-xs text-slate-500 hover:text-slate-900 underline"
                      >
                        {lt.messages.viewListing}
                      </Link>
                    )}
                    {m.wanted_listing_id && (
                      <Link
                        href={`/ieskau/${m.wanted_listing_id}`}
                        className="text-xs text-slate-500 hover:text-slate-900 underline"
                      >
                        {lt.messages.viewWanted}
                      </Link>
                    )}
                    {!isSent && (
                      <ReportButton targetType="message" targetId={m.id} compact />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
