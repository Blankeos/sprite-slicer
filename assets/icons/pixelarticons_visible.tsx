import { JSX, VoidProps } from "solid-js";

export default function Icon(props: VoidProps<JSX.SvgSVGAttributes<SVGSVGElement>>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M0 0h2v2H0zm2 2h2v2H2zm18 0h2v2h-2zm2-2h2v2h-2zM2 20h2v2H2zm-2 2h2v2H0zm20-2h2v2h-2zm2 2h2v2h-2zM8 17h8v2H8zm8-2h4v2h-4zm-8 0H4v2h4zm8-8h4v2h-4zM8 7H4v2h4zm12 2h2v2h-2zM4 9H2v2h2zm18 2h2v2h-2zM2 11H0v2h2zm18 2h2v2h-2zM4 13H2v2h2zm4-8h8v2H8zm2 5h4v4h-4z"
      />
    </svg>
  );
}
