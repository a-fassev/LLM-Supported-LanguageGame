import { RegisterForm } from "@/components/game/screens/RegisterForm";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="game-shell-inset flex h-dvh w-full items-center">
      <div className="game-centered-column flex flex-col gap-4">
        <h1 className="relative left-1/2 inline-block w-max max-w-[calc(100vw-(var(--game-shell-padding)*2))] -translate-x-1/2 -rotate-1 rounded-[2rem] border-[5px] border-[#fff6d8] bg-[#f8b93b] px-5 py-2 text-center text-[clamp(2rem,5.4vw,4.85rem)] font-black leading-none text-[#fff8df] shadow-[0_6px_0_#a63e1b,0_16px_34px_rgba(67,24,8,0.45)] [text-shadow:3px_3px_0_#a63e1b,-2px_-2px_0_#fff6d8,2px_-2px_0_#fff6d8,-2px_2px_0_#fff6d8,0_5px_0_#d66b22] whitespace-normal sm:whitespace-nowrap">
          L&apos;enigma di Bologna
        </h1>
        <div className="relative drop-shadow-[0_22px_34px_rgba(55,26,10,0.21)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-[3px] border border-[#b28a55]/15 bg-[#f1d9a6]/72 shadow-[0_2px_8px_rgba(69,38,15,0.13)] [background-image:linear-gradient(90deg,rgba(255,255,255,0.18),transparent_26%,rgba(255,255,255,0.16)_62%,transparent)]"
          />
          <div className="border border-[#8f5a33]/20 bg-[#fbf0dc]/94 p-5 [background-image:linear-gradient(146deg,rgba(255,253,247,0.97),rgba(248,236,216,0.94)_63%,rgba(238,223,198,0.9)),radial-gradient(circle_at_18%_28%,rgba(94,58,29,0.09)_0_0.7px,transparent_1px),radial-gradient(circle_at_76%_18%,rgba(120,76,38,0.055)_0_0.6px,transparent_0.95px),radial-gradient(circle_at_42%_78%,rgba(255,255,255,0.24)_0_0.9px,transparent_1.2px),repeating-linear-gradient(8deg,rgba(103,66,37,0.025)_0_1px,transparent_1px_14px)] [background-size:100%_100%,17px_19px,23px_21px,29px_31px,100%_100%] shadow-[0_5px_12px_rgba(55,26,10,0.1),0_1px_0_rgba(255,255,255,0.8)_inset,0_-14px_28px_rgba(111,68,34,0.05)_inset] ring-1 ring-white/35 backdrop-blur-sm [border-radius:10px_18px_13px_20px] md:p-6">
            <Card className="bg-transparent shadow-none ring-0">
              <RegisterForm />
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
