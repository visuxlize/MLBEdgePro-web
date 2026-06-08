"use server";

import { revalidatePath } from "next/cache";

export async function refreshPropsAction() {
  revalidatePath("/props", "page");
}
