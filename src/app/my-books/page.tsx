import { redirect } from "next/navigation";

// /my-books хаагдсан — ганц эх сурвалж профайл.
export default function MyBooksRedirect() {
  redirect("/profile");
}
