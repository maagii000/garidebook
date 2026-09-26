import { redirect } from "next/navigation";

// /books/new хаагдсан — ном нэмэх зөвхөн админаар. Хуучин холбоос catalog руу.
export default function BooksNewRedirect() {
  redirect("/catalog");
}
