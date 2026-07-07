/**
 * CSCard — Standard SaaS card using Sprint 1 design tokens.
 *
 * Props:
 *   children     — ReactNode
 *   className    — string (appended)
 *   as           — element type (default 'div')
 *   onClick      — function (adds cursor-pointer)
 *   hover        — boolean (enable hover lift, default true)
 *   padding      — 'default' | 'tight' | 'large' (default 'default')
 */
const PADDING_CLASS = {
  default: 'p-6',
  tight: 'p-4',
  large: 'p-8',
};

export default function CSCard({
  children,
  className = '',
  as: Tag = 'div',
  onClick = null,
  hover = true,
  padding = 'default',
  ...props
}) {
  const classes = [
    'cs-card',
    PADDING_CLASS[padding] || PADDING_CLASS.default,
    onClick ? 'cursor-pointer' : '',
    !hover ? 'cs-no-hover' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} onClick={onClick} {...props}>
      {children}
    </Tag>
  );
}