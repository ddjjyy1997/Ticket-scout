import { Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Contact Us</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop us a line anytime
            </p>
            <a
              href="mailto:support@ticketscout.ca"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              support@ticketscout.ca
            </a>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">Based In</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Built for Toronto, by Toronto
            </p>
            <p className="mt-3 text-sm font-medium text-primary">
              Toronto, ON, Canada
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold">Send Us a Message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We typically respond within 24 hours.
          </p>
          <form
            action={`mailto:support@ticketscout.ca`}
            method="GET"
            className="mt-6 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  name="name"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <input
                type="text"
                name="subject"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                name="body"
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
