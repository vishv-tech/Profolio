type FieldErrorProps = {
  id: string;
  messages?: string[];
};

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p className="text-sm text-destructive" id={id}>
      {messages[0]}
    </p>
  );
}
