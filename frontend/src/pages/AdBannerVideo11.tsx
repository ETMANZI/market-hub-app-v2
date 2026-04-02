export default function AdBannerVideo() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <video
        className="h-[90px] w-full object-cover md:h-[110px] lg:h-[120px]"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/ad-banner.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
