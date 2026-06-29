import { exitBarangayWorkspace } from "@/app/platform/actions";

export async function POST() {
  await exitBarangayWorkspace();
}
