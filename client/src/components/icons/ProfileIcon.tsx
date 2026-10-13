import type { SVGProps } from 'react'

export default function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      role="img"
      aria-label="Profilo"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="1.5"
      {...props}
    >
      <path d="M137.839,844.59C52.444,754.875 0,633.514 0,500C0,224.042 224.042,0 500,0C775.958,0 1000,224.042 1000,500C1000,633.514 947.556,754.875 862.161,844.59C812.315,644.619 668.924,500 500,500C331.076,500 187.685,644.619 137.839,844.59Z" fill="var(--color-background)" />
      <path d="M137.839,844.59C187.685,644.619 331.076,500 500,500C668.924,500 812.315,644.619 862.161,844.59C771.055,940.306 642.444,1000 500,1000C357.556,1000 228.945,940.306 137.839,844.59Z" fill="var(--color-primary)" />
      <g transform="matrix(1.374736,0,0,1.374736,788.407357,-326.798525)">
        <circle cx="-209.791" cy="544.9" r="122.605" fill="var(--color-primary)" stroke="var(--color-background)" strokeWidth="30.31" />
      </g>
    </svg>
  )
}
