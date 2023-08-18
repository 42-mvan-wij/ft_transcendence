import { useSubscription } from "@apollo/client";
import { useEffect, useState } from "react";
import { gql } from "@apollo/client";

const CHANNEL_CREATED_SUBSCRIPTION = gql`
	subscription {
		channelCreated {
			id
		}
	}
`;

export default function useChannelCreatedSubscription() {
	const { data, error } = useSubscription(CHANNEL_CREATED_SUBSCRIPTION);

	const [channelCreated, setChannelCreated] = useState(null);

	useEffect(() => {
		if (data) setChannelCreated(data.channelCreated);
	}, [data]);

	if (error) console.log("subscriptionError", error);
	return { channelCreated };
}
