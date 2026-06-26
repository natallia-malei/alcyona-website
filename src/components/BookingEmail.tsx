interface BookingEmailProps {
  email: string;
}

export function BookingEmail({ email }: BookingEmailProps) {
  return (
    <a
      href={`mailto:${email}`}
      className="inline-block text-2xl md:text-3xl font-semibold underline underline-offset-8 hover:text-accent transition-colors mb-10"
    >
      {email}
    </a>
  );
}
