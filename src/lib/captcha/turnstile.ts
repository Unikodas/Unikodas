type CaptchaProvider = {
  verifyToken(token: string | null): Promise<boolean>;
};

export const turnstileCaptchaProvider: CaptchaProvider = {
  async verifyToken(token: string | null): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
      throw new Error('TURNSTILE_SECRET_KEY is missing');
    }

    if (!token) {
      return false;
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
      },
    );

    const result = await response.json();

    return Boolean(result.success);
  },
};