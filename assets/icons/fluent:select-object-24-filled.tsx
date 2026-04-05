import { type JSX } from 'solid-js';

export default function Icon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M7 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m1 0a1 1 0 0 0 1 1h6a1 1 0 1 0 0-2H9a1 1 0 0 0-1 1M5 8a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1m14 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1M9 20a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2zm-4 1a2 2 0 1 0 0-4a2 2 0 0 0 0 4M21 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-2 16a2 2 0 1 0 0-4a2 2 0 0 0 0 4"/></svg>);
}