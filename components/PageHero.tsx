import Image from "next/image";
import Breadcrumb, { Crumb } from "./Breadcrumb";

export default function PageHero({
  image,
  title,
  subtitle,
  breadcrumb,
}: {
  image: string;
  title: string;
  subtitle: string;
  breadcrumb: Crumb[];
}) {
  return (
    <section className="page-hero">
      <div className="hero-bg">
        <Image src={image} alt={title} fill priority sizes="100vw" />
      </div>
      <div className="container">
        <Breadcrumb items={breadcrumb} />
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}
