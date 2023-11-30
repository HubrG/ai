import { LoginButton } from "./header/auth/LoginButton";
import { UserProfile } from "./header/auth/UserProfile";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrainCircuit } from "@fortawesome/pro-solid-svg-icons";
import Link from "next/link";
import MainMenu from "@/src/feature/header/MainMenu";
import BurgerMenu from "@/src/feature/header/BurgerMenu";
import { ThemeToggle } from "../theme/ThemeToggle";
import { faCube } from "@fortawesome/pro-duotone-svg-icons";
import { getUserLog } from "@/src/query/user.query";

export const Navbar = async () => {
  const user = await getUserLog();
  //  Construction du menu
  const prefix = "/";
  const links = [
    {
      url: prefix + "how-it-works",
      name: "How it works ?",
    },
    { url: prefix + "pricing", name: "Pricing" },
    { url: prefix + "contact", name: "Contact" },
  ];
  //
  return (
    <header className=" z-20 w-full">
      <nav>
        <div>
          <Link href="/" className="logo mr-2">
            <span className="sm:text-xs flex flex-row">
              <span className="mr-1">
                {/* <FontAwesomeIcon
                  className="mr-1"
                  icon={faBrainCircuit}
                /> */}
              </span>
              <span>Fastuff</span>
              <sup className="mt-1 ml-2 text-sm text-secondary/60">ai</sup>
            </span>
          </Link>
          <div className="flex gap-x-2 md:order-2 items-center lg:text-base">
            <div className="flex items-center gap-x-2">
              <Link href="/raconter-ses-memoires/tarifs" className=" md:block hidden">
                <Button
                  className="px-4 font-bold text-base"
                  variant="ghost"
                  size={"lg"}>
                  <FontAwesomeIcon
                    icon={faCube}
                    beat
                    className="mr-2  text-secondary/80"
                  />
                  Try us for free !
                </Button>
              </Link>
              <div className="md:block hidden">
                  {user ? <UserProfile userInfo={user} /> : <LoginButton />}
              </div>
              <ThemeToggle />
            </div>{" "}
            <BurgerMenu links={links} user={user} />
          </div>
          <MainMenu links={links} />
        </div>
      </nav>
    </header>
  );
};
