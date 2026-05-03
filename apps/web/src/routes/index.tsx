import { Button } from "@ecoExchange/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bike, Leaf, PackageCheck, Recycle, Sprout, Store, Users } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    alt: "Local farmer working with sustainable crops",
  },
  {
    src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    alt: "Workers preparing local produce",
  },
  {
    src: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80",
    alt: "Fresh vegetables from a local farm",
  },
];

const testimonials = [
  {
    name: "Jenny, college student",
    story:
      "I used to buy cheap single-use items online. EcoExchange helped me find reusable bottles, tote bags, and notebooks from nearby sellers without spending too much.",
  },
  {
    name: "Mang Lito, furniture restorer",
    story:
      "My repaired chairs and lamps now reach customers outside our barangay. Instead of being thrown away, old furniture gets a second life.",
  },
  {
    name: "Ate Maricel, sari-sari store owner",
    story:
      "The platform gives our small shop a cleaner way to list eco-friendly products and compete with bigger online stores.",
  },
  {
    name: "Paolo, delivery rider",
    story:
      "Orders are clearer because customers and sellers agree on delivery fees first. It makes booking Lalamove or Maxim easier for everyone.",
  },
];

function HomeComponent() {
  return (
    <main className="h-[calc(100svh-65px)] w-full snap-y snap-mandatory overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_top_left,#dff3bf_0%,transparent_32%),linear-gradient(180deg,#f4f9e9_0%,#fff8ec_48%,#eff8e8_100%)]">
      <Slide className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-7">
          <Badge>
            <Leaf className="size-4" />
            Eco-friendly shopping, right at your doorstep
          </Badge>
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">
              Sustainable local commerce
            </p>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-emerald-950 sm:text-6xl lg:text-7xl">
              ECO EXCHANGE
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A green marketplace where small businesses, farmers, workers, and everyday buyers
              trade reusable, recycled, restored, and locally made goods.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/products">
              <Button size="lg" className="bg-emerald-700 px-6 hover:bg-emerald-800">
                Explore the marketplace
              </Button>
            </Link>
            <Link to="/sell">
              <Button size="lg" variant="outline" className="bg-white/70 px-6">
                Start selling
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-emerald-900/10 bg-white/75 p-3 shadow-2xl shadow-emerald-950/10">
          <div className="grid gap-3">
            <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
              <img
                className="h-[52svh] min-h-72 rounded-[2rem] object-cover"
                src={heroImages[0].src}
                alt={heroImages[0].alt}
              />
              <div className="grid gap-3">
                {heroImages.slice(1).map((image) => (
                  <img
                    key={image.src}
                    className="h-[25svh] min-h-32 rounded-[1.5rem] object-cover"
                    src={image.src}
                    alt={image.alt}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-emerald-950 p-5 text-emerald-50">
              <p className="text-sm text-emerald-100">From local hands to your home</p>
              <p className="mt-2 text-2xl font-semibold">Reduce waste. Support communities.</p>
            </div>
          </div>
        </Card>
      </Slide>

      <Slide className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <Badge>
            <Sprout className="size-4" />
            Why EcoExchange exists
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl">
            A sustainable business model for local sellers.
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            The original EcoExchange concept focuses on helping small local businesses compete with
            larger e-commerce platforms while promoting eco-friendly shopping habits. The website
            brings that idea into a simple marketplace.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ValueCard icon={<Store className="size-5" />} title="Small business visibility">
            Sellers can list eco goods, manage stock, receive orders, and coordinate delivery.
          </ValueCard>
          <ValueCard icon={<Recycle className="size-5" />} title="Circular consumption">
            Buyers discover reusable, recycled, repaired, and locally restored products.
          </ValueCard>
          <ValueCard icon={<Users className="size-5" />} title="Community impact">
            Local farmers, workers, makers, riders, and micro-businesses become part of the value chain.
          </ValueCard>
          <ValueCard icon={<Bike className="size-5" />} title="Door-to-door delivery">
            Sellers can quote Lalamove, Maxim, or other delivery fees before booking riders.
          </ValueCard>
        </div>
      </Slide>

      <Slide className="space-y-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Badge className="mx-auto">
            <PackageCheck className="size-4" />
            User stories
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl">
            Realistic ways EcoExchange helps people shift to greener habits.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-emerald-900/10 bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                <CardDescription>EcoExchange community member</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-7 text-muted-foreground">"{testimonial.story}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Slide>

      <Slide className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <Badge>
            <Leaf className="size-4" />
            Join the exchange
          </Badge>
          <h2 className="max-w-4xl text-4xl font-semibold tracking-tight text-emerald-950 sm:text-6xl">
            Shop with purpose or turn your eco-friendly goods into a local business.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            EcoExchange is designed to be simple: browse products, create an account, list goods,
            accept orders, and keep the community moving toward sustainable choices.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/products">
              <Button size="lg" className="bg-emerald-700 px-6 hover:bg-emerald-800">
                Shop now
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white/70 px-6">
                Create account
              </Button>
            </Link>
          </div>
        </div>
        <Card className="border-emerald-900/10 bg-emerald-950 p-6 text-emerald-50 shadow-2xl">
          <CardHeader>
            <CardDescription className="text-emerald-200">Presentation summary</CardDescription>
            <CardTitle className="text-3xl text-emerald-50">EcoExchange in one line</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base leading-7 text-emerald-100">
            <p>
              A community marketplace that helps local sellers compete online while helping buyers
              reduce waste through sustainable products.
            </p>
            <div className="grid gap-3 text-sm">
              <Stat label="Business model" value="3% site upkeep fee" />
              <Stat label="Impact" value="Local sellers + circular goods" />
              <Stat label="Delivery" value="Manual Lalamove or Maxim coordination" />
            </div>
          </CardContent>
        </Card>
      </Slide>
    </main>
  );
}

function Slide({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className="flex min-h-[calc(100svh-65px)] w-full snap-start snap-always items-center px-4 py-8 sm:px-8 lg:px-12"
    >
      <div className={`mx-auto w-full max-w-7xl ${className}`}>{children}</div>
    </section>
  );
}

function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm text-emerald-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function ValueCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="border-emerald-900/10 bg-white/80">
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">{children}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-emerald-700/60 bg-emerald-900/70 px-4 py-3">
      <span className="text-emerald-200">{label}</span>
      <span className="font-medium text-emerald-50">{value}</span>
    </div>
  );
}
