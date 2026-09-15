"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function ProfileLink({ href, label }) {
  const className =
    "group inline-flex items-center gap-1 text-sm text-neutral-800 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline";

  if (!href || href === "#") {
    return (
      <button type="button" className={className}>
        {label}
        <ArrowUpRight
          size={13}
          aria-hidden
          className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
        />
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      <ArrowUpRight
        size={13}
        aria-hidden
        className="transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
      />
    </Link>
  );
}

export const UserProfileCard = forwardRef(
  (
    {
      className,
      name = "TechNova Solutions",
      title = "Recruitment Dashboard",
      bio = "",
      image = "",
      imageAlt,
      emailHref = "#",
      websiteHref = "#",
      emailLabel = "",
      websiteLabel = "",
      sectionLabel = "Profile",
      ...props
    },
    ref,
  ) => {
    const alt = imageAlt ?? name;

    return (
      <article
        ref={ref}
        data-slot="user-profile-card"
        className={cn(
          "w-full border border-neutral-200 bg-[#f6f2eb] p-5 font-sans rounded-xl",
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
          <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
            {sectionLabel}
          </span>
        </div>

        <div className="flex gap-4">
          <Avatar className="size-16 shrink-0 rounded-none border border-neutral-300 bg-neutral-100">
            <AvatarImage src={image} alt={alt} className="object-cover" />
            <AvatarFallback className="rounded-none bg-transparent text-xl font-semibold text-neutral-400">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 pt-0.5">
            <h3 className="font-serif text-2xl leading-none tracking-tight text-neutral-950">
              {name}
            </h3>
            <p className="mt-2 font-mono text-[10px] font-medium tracking-[0.16em] text-neutral-500 uppercase">
              {title}
            </p>
          </div>
        </div>

        {bio && <p className="mt-4 text-sm leading-relaxed text-neutral-700">{bio}</p>}

        {(emailLabel || websiteLabel) && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-200 pt-4">
            {emailLabel && <ProfileLink href={emailHref} label={emailLabel} />}
            {websiteLabel && <ProfileLink href={websiteHref} label={websiteLabel} />}
          </div>
        )}
      </article>
    );
  },
);

UserProfileCard.displayName = "UserProfileCard";
