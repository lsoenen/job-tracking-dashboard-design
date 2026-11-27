/**
 * The part of a posting that matters for tailoring: from the first responsibilities or
 * qualifications heading on, skipping the company boilerplate that usually comes first.
 */
export function postingCriteria(posting: string) {
  const heading =
    /^\s*(?:what you.?ll do|what you will do|responsibilities|the role|in this role|your role|what you.?ll bring|qualifications|requirements|about you|who you are|you have|you might be|skills)\b/im
  const match = heading.exec(posting)
  const text = match ? posting.slice(match.index) : posting
  return text.slice(0, 5000)
}
