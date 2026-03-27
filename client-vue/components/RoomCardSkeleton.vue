<template>
  <article class="animate-pulse rounded-2xl border border-white/10 bg-slate-800/55 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.22)] backdrop-blur-sm">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-stretch gap-3">
          <div class="h-10 w-7 rounded-xl bg-white/8" />
          <div class="min-w-0 flex-1 text-left">
            <div class="block h-5 w-40 max-w-full rounded-full bg-white/10" />
            <div class="mt-2 block h-3 w-24 rounded-full bg-white/8" />
          </div>
        </div>
      </div>

      <div class="h-10 w-20 shrink-0 rounded-lg bg-white/10" />
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div class="flex min-w-0 flex-col items-center text-center">
        <div class="h-3 w-12 rounded-full bg-white/8" />
        <div class="mt-2 h-5 w-12 rounded-full bg-white/10" />
      </div>
      <div class="flex flex-col items-center text-center">
        <div class="h-3 w-10 rounded-full bg-white/8" />
        <div class="mt-2 h-5 w-16 rounded-full bg-white/10" />
      </div>
      <div class="flex min-w-0 flex-col items-center text-center">
        <div class="h-3 w-12 rounded-full bg-white/8" />
        <div class="mt-2 h-4 w-4 rounded-full bg-white/10" />
      </div>
    </div>
  </article>
</template>
