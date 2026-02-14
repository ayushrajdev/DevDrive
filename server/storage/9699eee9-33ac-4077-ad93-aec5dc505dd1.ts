import { cookies } from "next/headers";

export async function getUserFromCookies() {

  try {

    const cookieStore = await cookies();
    const id = cookieStore.get("token")?.value;
    if (!id) {
      return null;
    }

  } catch (error) {

  }

}
