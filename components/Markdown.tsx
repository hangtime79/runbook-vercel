import { Fragment, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the owner-edited markdown in content/. `Inline` is for one-line fields (a title, a quote):
 * bold, italics, code and links work, and the text is not wrapped in a paragraph, so a plain line
 * renders exactly as the bare string would. `Block` is for sections: paragraphs, lists and the same
 * inline marks. No raw HTML in either, except that `Inline` turns a literal `<br>` into a line break.
 */
const INLINE = ["strong", "em", "code", "a", "del"];
const BLOCK = ["p", "br", "ul", "ol", "li", "blockquote", ...INLINE];

const link = ({ href, children }: { href?: string; children?: ReactNode }) => {
  const external = !!href && /^https?:/.test(href);
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="underline underline-offset-2">
      {children}
    </a>
  );
};

const BREAK = /\s*<br\s*\/?>\s*/i;

export function Inline({ children }: { children: string }) {
  const lines = children.split(BREAK);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={INLINE} unwrapDisallowed components={{ a: link }}>
            {line}
          </ReactMarkdown>
        </Fragment>
      ))}
    </>
  );
}

export function Block({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`[&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-1.5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={BLOCK} unwrapDisallowed components={{ a: link }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
