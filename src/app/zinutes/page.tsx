import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { makeMessageThreadKey } from '@/lib/messages/thread-key';
import { ReportButton } from '@/components/ReportButton';
import { LogoLink } from '@/components/LogoLink';
import { LoginPrompt } from '@/components/LoginPrompt';
import { ConversationComposer } from './ConversationComposer';

const PAGE_SIZE = 150;

type SearchParams = Record<string, string | string[] | undefined>;

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

type Conversation = {
  key: string;
  otherId: string;
  otherName: string;
  messages: MessageRow[];
  latest: MessageRow;
  listingId: string | null;
  wantedListingId: string | null;
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

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('lt-LT', {
    month: 'short',
    day: 'numeric',
  });
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}...`;
}

function getRequestedThread(searchParams: SearchParams): string | null {
  const value = searchParams.thread;
  if (typeof value !== 'string' || value.length === 0) return null;
  return value;
}

function buildConversations(
  rows: MessageRow[],
  userId: string,
  displayNames: Map<string, string>,
): Conversation[] {
  const byKey = new Map<string, MessageRow[]>();

  for (const message of rows) {
    const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id;
    const key = makeMessageThreadKey({
      otherId,
      listingId: message.listing_id,
      wantedListingId: message.wanted_listing_id,
    });
    const group = byKey.get(key) ?? [];
    group.push(message);
    byKey.set(key, group);
  }

  return Array.from(byKey.entries())
    .map(([key, messages]) => {
      const sorted = [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const latest = sorted[sorted.length - 1];
      const otherId = latest.sender_id === userId ? latest.recipient_id : latest.sender_id;

      return {
        key,
        otherId,
        otherName: displayNames.get(otherId) ?? lt.messages.unknownUser,
        messages: sorted,
        latest,
        listingId: latest.listing_id,
        wantedListingId: latest.wanted_listing_id,
      };
    })
    .sort(
      (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime(),
    );
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedThread = getRequestedThread(params);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_92%,transparent)] backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      {!userData.user ? (
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <LoginPrompt redirectTo="/zinutes" />
        </main>
      ) : (
        <SignedInInbox userId={userData.user.id} requestedThread={requestedThread} />
      )}
    </>
  );
}

async function SignedInInbox({
  userId,
  requestedThread,
}: {
  userId: string;
  requestedThread: string | null;
}) {
  const supabase = await createClient();
  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('id, listing_id, wanted_listing_id, sender_id, recipient_id, body, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (msgError) {
    console.error('[zinutes] messages fetch failed:', msgError);
  }
  const rows = (msgData ?? []) as MessageRow[];

  const otherIds = new Set<string>();
  for (const message of rows) {
    if (message.sender_id !== userId) otherIds.add(message.sender_id);
    if (message.recipient_id !== userId) otherIds.add(message.recipient_id);
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
    for (const profile of (profiles ?? []) as PublicProfile[]) {
      if (profile.display_name) displayNames.set(profile.id, profile.display_name);
    }
  }

  const conversations = buildConversations(rows, userId, displayNames);
  const requestedConversation =
    conversations.find((conversation) => conversation.key === requestedThread) ?? null;
  const selected = requestedConversation ?? conversations[0] ?? null;
  const showMobileChat = !!requestedConversation;

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">{lt.messages.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Visi pokalbiai su pirkėjais ir pardavėjais vienoje vietoje.
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--card)] px-4 py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">{lt.messages.empty}</p>
        </div>
      ) : (
        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside
            className={[
              'rounded-3xl border border-[var(--border)] bg-[var(--card)] lg:block',
              showMobileChat ? 'hidden' : 'block',
            ].join(' ')}
          >
            <ConversationList
              conversations={conversations}
              selectedKey={selected?.key ?? null}
              userId={userId}
            />
          </aside>

          <section
            className={[
              'overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] lg:block',
              showMobileChat ? 'block' : 'hidden',
            ].join(' ')}
          >
            {selected && <ConversationView conversation={selected} userId={userId} />}
          </section>
        </div>
      )}
    </main>
  );
}

function ConversationList({
  conversations,
  selectedKey,
  userId,
}: {
  conversations: Conversation[];
  selectedKey: string | null;
  userId: string;
}) {
  return (
    <ul className="divide-y divide-[var(--border)]">
      {conversations.map((conversation) => {
        const isSelected = conversation.key === selectedKey;
        const isSent = conversation.latest.sender_id === userId;
        const contextHref = conversation.listingId
          ? `/skelbimas/${conversation.listingId}`
          : conversation.wantedListingId
            ? `/ieskau/${conversation.wantedListingId}`
            : null;

        return (
          <li key={conversation.key}>
            <Link
              href={`/zinutes?thread=${encodeURIComponent(conversation.key)}`}
              className={[
                'block p-4 transition hover:bg-[var(--muted)]',
                isSelected ? 'bg-[var(--muted)]' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-[var(--foreground)]">
                    {conversation.otherName}
                  </p>
                  {contextHref && (
                    <span className="mt-1 inline-flex rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                      {conversation.listingId ? lt.messages.viewListing : lt.messages.viewWanted}
                    </span>
                  )}
                </div>
                <time className="shrink-0 text-xs text-[var(--muted-soft)]">
                  {shortDate(conversation.latest.created_at)}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
                {isSent ? `${lt.messages.sentTo}: ` : ''}
                {truncate(conversation.latest.body, 100)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ConversationView({
  conversation,
  userId,
}: {
  conversation: Conversation;
  userId: string;
}) {
  const contextHref = conversation.listingId
    ? `/skelbimas/${conversation.listingId}`
    : conversation.wantedListingId
      ? `/ieskau/${conversation.wantedListingId}`
      : null;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="sticky top-[3.75rem] z-10 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_94%,transparent)] px-4 py-3 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/zinutes"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] lg:hidden"
            aria-label={lt.common.back}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-[var(--foreground)]">
              {conversation.otherName}
            </h2>
            {contextHref && (
              <Link
                href={contextHref}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                {conversation.listingId ? lt.messages.viewListing : lt.messages.viewWanted}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 py-4">
        {conversation.messages.map((message) => {
          const isSent = message.sender_id === userId;
          return (
            <div
              key={message.id}
              className={['flex', isSent ? 'justify-end' : 'justify-start'].join(' ')}
            >
              <div
                className={[
                  'max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm',
                  isSent
                    ? 'rounded-br-lg bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'rounded-bl-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]',
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap leading-6">{message.body}</p>
                <div
                  className={[
                    'mt-2 flex items-center gap-3 text-[0.7rem]',
                    isSent ? 'text-white/75' : 'text-[var(--muted-soft)]',
                  ].join(' ')}
                >
                  <time>{formatDate(message.created_at)}</time>
                  {!isSent && <ReportButton targetType="message" targetId={message.id} compact />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] border-t border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_95%,transparent)] p-3 backdrop-blur sm:bottom-0">
        <ConversationComposer threadKey={conversation.key} />
      </div>
    </div>
  );
}
