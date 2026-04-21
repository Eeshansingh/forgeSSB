import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Psychology Tests — ForgeSSB" },
      {
        name: "description",
        content:
          "Psychological assessment modules: WAT, TAT and SRT. Train under real SSB conditions.",
      },
      { property: "og:title", content: "Psychology Tests — ForgeSSB" },
      {
        property: "og:description",
        content: "Begin with the Word Association Test. TAT and SRT deploy soon.",
      },
    ],
  }),
  component: TestsLayout,
});

function TestsLayout() {
  return <Outlet />;
}
