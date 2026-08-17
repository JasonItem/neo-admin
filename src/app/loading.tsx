import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-svh w-full bg-background" aria-label="应用加载中">
      <aside className="hidden w-64 border-r p-4 md:flex md:flex-col md:gap-5">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
          <Skeleton className="size-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto size-8 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-[32rem] w-full rounded-lg" />
          </div>
        </div>
      </section>
    </main>
  );
}
