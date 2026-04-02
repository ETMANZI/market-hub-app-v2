import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RightSidebar from "./RightSidebar";
import PageContainer from "./PageContainer";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <PageContainer>
        <div className="grid gap-8 py-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* DESKTOP SIDEBAR */}
          <div className="hidden xl:block">
            <div className="sticky top-[120px] h-fit">
              <RightSidebar />
            </div>
          </div>

          <div className="min-w-0">
            <Outlet />

            <div className="mt-8 xl:hidden">
              <RightSidebar />
            </div>


{/* <div className="mt-8 xl:hidden">
  <div className="xl:block">
    <details className="mb-4">
      <summary className="cursor-pointer font-semibold text-slate-700">
        Filters / Info
      </summary>

      <div className="mt-3">
        <RightSidebar />
      </div>
    </details>
  </div>
</div> */}



          </div>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}