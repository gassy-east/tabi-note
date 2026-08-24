interface BusyVeilProps {
  message: string
}

export function BusyVeil({ message }: BusyVeilProps) {
  return (
    <div className="busy-veil">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  )
}
