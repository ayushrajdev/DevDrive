import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React from "react";

const Rq = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["session"],
    queryFn: () =>
      fetch("http://localhost:4000/admin/").then((res) => res.json()),
    // staleTime: 300000,
    // gcTime: 300000,
    // refetchInterval: 100000,
    // refetchIntervalInBackground: true,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      Rq
      {JSON.stringify(data)}
    </div>
  );
};

export default Rq;


// 49496056122-gtvbtjankhnq56ei05dmv01v7nsgjvvq.apps.googleusercontent.com