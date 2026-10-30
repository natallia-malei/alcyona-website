interface BookingEmailProps {
  email: string;
}

export function BookingEmail({ email }: BookingEmailProps) {
  return (
    <a
      href={`mailto:${email}`}
      className="mb-10 inline-block border-b border-accent/50 pb-1.5 font-display text-3xl font-medium transition-colors hover:border-accent-hi hover:text-accent-hi md:text-5xl"
    >
      {email}
    </a>
  );
}
