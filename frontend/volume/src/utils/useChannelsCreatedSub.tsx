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
	const { data: subscriptionData, error: subscriptionError } = useSubscription(
		CHANNEL_CREATED_SUBSCRIPTION
	);

	const [channelCreated, setChannelCreated] = useState(null);

	useEffect(() => {
		if (subscriptionData) setChannelCreated(subscriptionData.channelCreated);
	}, [subscriptionData]);

	if (subscriptionError) console.log("subscriptionError", subscriptionError);

	return { channelCreated };
}
