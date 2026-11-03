import { AuthRedirect } from '../../src/components/AuthRedirect';

/** Resolve membership slug then redirect to `/(member)/[slug]`. */
export default function MemberIndex() {
  return <AuthRedirect mode="authed-only" />;
}
