import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="panel rounded-[24px] p-8 space-y-4">
      <h1 className="display text-4xl">You&apos;re offline</h1>
      <p className="text-[var(--ink-soft)]">
        LinkApply cached this shell. Reconnect to scrape new jobs or prepare materials.
        Your saved profile and queue stay on this device.
      </p>
      <Link href="/" className="btn btn-primary inline-flex">
        Back to queue
      </Link>
    </div>
  );
}
