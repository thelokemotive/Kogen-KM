export default function Avatar({
  name,
  path,
  size,
}: {
  name: string;
  path: string | null;
  size?: 'sm' | 'lg';
}) {
  const cls = `avatar${size ? ` ${size}` : ''}`;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className={cls} aria-hidden="true">
      {path ? <img src={`/api/files/${path}`} alt="" /> : initials || '?'}
    </span>
  );
}
