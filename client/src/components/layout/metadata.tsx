import React from "react";

interface MetadataProps {
  pageTitle?: string;
}

export function Metadata({ pageTitle }: MetadataProps) {
  const title = pageTitle ? `${pageTitle} | Eleve Estudos` : "Eleve Estudos";
  
  React.useEffect(() => {
    document.title = title;
  }, [title]);
  
  return null;
}
