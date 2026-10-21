/** Real, verifiable links only. Nothing here is invented. */
export const REPO_URL = 'https://github.com/luvley-dee48/Signal-Bridge-AI-'
export const CONTACT_URL = `${REPO_URL}/issues/new`

export type AccessTab = 'signin' | 'signup'
export interface PageActions {
  openAccess: (tab: AccessTab) => void
}
