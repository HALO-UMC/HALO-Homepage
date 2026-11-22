export const KIRI_INVITE_URLS = Object.freeze({
  androidHost: "https://kiri.app",
  iosScheme: "kiri://invite",
});

const INVITE_PATH_PATTERN = /^\/invite\/([^/]+)\/?$/;

export function parseInviteToken(pathname) {
  const match = INVITE_PATH_PATTERN.exec(pathname);
  if (!match) {
    return null;
  }

  try {
    const token = decodeURIComponent(match[1]);
    const hasControlCharacter = [...token].some((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint <= 31 || codePoint === 127;
    });

    if (
      !token.trim() ||
      token.includes("/") ||
      token.includes("\\") ||
      hasControlCharacter
    ) {
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

export function getInviteAppUrl(token, userAgent = "") {
  const encodedToken = encodeURIComponent(token);

  if (/android/i.test(userAgent)) {
    return `${KIRI_INVITE_URLS.androidHost}/invite/${encodedToken}`;
  }

  return `${KIRI_INVITE_URLS.iosScheme}/${encodedToken}`;
}
