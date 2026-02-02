import NavbarClient from "./NavbarClient";
import { getCategories } from "@/lib/data";

const Navbar = async () => {
  const categories = await getCategories();
  return <NavbarClient categories={categories} />;
};

export default Navbar;
