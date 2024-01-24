import Image from "next/image";
import { DataLight } from "../../interfaces";

export interface EmojiProps {
  data: DataLight;
}

const ThankYou: React.FC<EmojiProps> = ({ data }: EmojiProps) => {
  return (
    <div
      style={{ transform: "scale(.7)" }}
      className="bg-black hover:invert text-white w-1/2 mx-auto mt-3 p-1 pt-1.5 text-xs text-center rounded-xl select-none"
    >
      <a
        href="https://github.com/felixrieseberg/wrapped"
        target="_blank"
        rel="noopener noreferrer"
      >
        <p>
          Created with{" "}
          <Image
            className="inline-block"
            src="/heart.png"
            width={20}
            height={20}
            alt="heart"
          />{" "}
          in San Francisco
        </p>
      </a>
    </div>
  );
};

export default ThankYou;
