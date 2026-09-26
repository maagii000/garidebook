import { redirect } from "next/navigation";

// /wishlist хаагдсан — ганц эх сурвалж /profile#wishlist.
// Хуучин линк/bookmark эвдэрдэггүй: автоматаар профайл руу шилжинэ.
export default function WishlistRedirect() {
  redirect("/profile#wishlist");
}
