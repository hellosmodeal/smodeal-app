import { AppwriteException, ID, type Models } from 'node-appwrite'

import { callbackUrl } from './rules'

type Credentials = { email: string; password: string }

type SignInAccount = {
  createEmailPasswordSession: (params: Credentials) => Promise<Models.Session>
}

type SignUpAccount = SignInAccount & {
  create: (
    params: Credentials & { userId: string; name: string },
  ) => Promise<unknown>
}

type VerificationAccount = {
  createEmailVerification: (params: { url: string }) => Promise<unknown>
  updateEmailVerification: (params: {
    userId: string
    secret: string
  }) => Promise<unknown>
}

type RecoveryAccount = {
  createRecovery: (params: { email: string; url: string }) => Promise<unknown>
  updateRecovery: (params: {
    userId: string
    secret: string
    password: string
  }) => Promise<unknown>
}

export function appwriteErrorCode(error: unknown): number | undefined {
  return error instanceof AppwriteException ? error.code : undefined
}

export async function createEmailPasswordSession(
  account: SignInAccount,
  credentials: Credentials,
): Promise<Models.Session> {
  return account.createEmailPasswordSession(credentials)
}

export async function createAccountAndSession(
  account: SignUpAccount,
  data: Credentials & { name: string },
): Promise<Models.Session> {
  await account.create({ userId: ID.unique(), ...data })
  return account.createEmailPasswordSession({
    email: data.email,
    password: data.password,
  })
}

export async function registerAndSendVerification(
  account: SignUpAccount,
  sessionAccount: (
    secret: string,
  ) => Pick<VerificationAccount, 'createEmailVerification'>,
  data: Credentials & { name: string },
  siteUrl: string | undefined,
): Promise<{ session: Models.Session; verificationSent: boolean }> {
  const session = await createAccountAndSession(account, data)
  try {
    await sendEmailVerification(sessionAccount(session.secret), siteUrl)
    return { session, verificationSent: true }
  } catch {
    // Le compte existe : l’échec d’envoi est signalé, le lien pourra être renvoyé depuis le compte.
    return { session, verificationSent: false }
  }
}

export async function sendEmailVerification(
  account: Pick<VerificationAccount, 'createEmailVerification'>,
  siteUrl: string | undefined,
): Promise<void> {
  await account.createEmailVerification({
    url: callbackUrl(siteUrl, '/verification-email'),
  })
}

export async function requestPasswordRecovery(
  account: Pick<RecoveryAccount, 'createRecovery'>,
  email: string,
  siteUrl: string | undefined,
): Promise<{ ok: true }> {
  try {
    await account.createRecovery({
      email,
      url: callbackUrl(siteUrl, '/reinitialiser-mot-de-passe'),
    })
  } catch {
    // Le résultat doit rester indistinguable pour protéger l’existence du compte.
  }
  return { ok: true }
}

export async function completeEmailVerification(
  account: Pick<VerificationAccount, 'updateEmailVerification'>,
  userId: string,
  secret: string,
): Promise<void> {
  await account.updateEmailVerification({ userId, secret })
}

export async function completePasswordRecovery(
  account: Pick<RecoveryAccount, 'updateRecovery'>,
  userId: string,
  secret: string,
  password: string,
): Promise<void> {
  await account.updateRecovery({ userId, secret, password })
}
