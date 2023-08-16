import { useState, useEffect } from "react";
import "../../styles/style.css";
import * as i from "../../types/Interfaces";
import { gql, useQuery } from "@apollo/client";
import ChangePrivileges from "../chat/ChangePrivileges";
import GroupStats from "../chat/GroupStats";

export default function Modal(props: i.ModalProps) {
	const closeModal = () => {
		props.setShowModal(false);
		window.history.pushState(null, "", window.location.pathname);
	};

	useEffect(() => {
		setModalContent(props);

		const serializableModalState = props.modalState;
		for (const key in serializableModalState) {
			if (typeof serializableModalState[key] === "function") {
				delete serializableModalState[key];
			}
		}
		window.history.pushState(serializableModalState, "", `home?${props.modalState.type}`);

		// const handlePopstate = (event: PopStateEvent) => {
		// 	const modalState = event.state;
		// 	if (modalState) {
		// 		if (modalState.type === "ChangePrivileges") {
		// 			props.setContent(
		// 				<ChangePrivileges
		// 					{...props}
		// 					group={modalState.group}
		// 					setChatState={modalState.setChatState}
		// 					selectedGroup={modalState.group_chat}
		// 					refetchChannel={modalState.refetchChannel}
		// 				/>
		// 			);
		// 		} else if (modalState.type === "GroupStats") {
		// 			props.setContent(
		// 				<GroupStats
		// 					{...props}
		// 					setChatState={modalState.setChatState}
		// 					selectedGroup={modalState.data.group_chat}
		// 					refetchChannel={modalState.refetchChannel}
		// 				/>
		// 				// <GroupStats selectedUser={{ id: modalState.userId }} /* other props */ />
		// 			);
		// 		}
		// 	}
		// };

		// Listen for popstate events whenever the component is mounted
		// window.addEventListener("popstate", handlePopstate);

		// Clean up the event listener when the component is unmounted
		// return () => {
		// window.removeEventListener("popstate", handlePopstate);
		// };
	}, [props.modalState]);

	return (
		<>
			{props.showModal && (
				<div className="modal">
					<div className="modal-content">
						<span className="close" onClick={() => closeModal()}>
							&times;
						</span>
						{props.modalContent}
					</div>
				</div>
			)}
		</>
	);
}

function setModalContent(props: any) {
	if (props.modalState.type === "GroupStats") {
		props.setContent(
			<GroupStats
				{...props}
				setChatState={props.modalState.setChatState}
				selectedGroup={props.modalState.selectedGroup}
				refetchChannel={props.modalState.refetchChannel}
			/>
		);
	} else if (props.modalState.type === "ChangePrivileges") {
		props.setContent(
			<ChangePrivileges
				{...props}
				setChatState={props.modalState.setChatState}
				selectedGroup={props.modalState.selectedGroup}
				refetchChannel={props.modalState.refetchChannel}
			/>
		);
	}
}

const CURRENT_USER = gql`
	query currentUserQuery {
		currentUserQuery {
			username
			avatar {
				file
			}
			id
		}
	}
`;

export function createModalProps(): i.ModalProps {
	const { loading, error, data } = useQuery(CURRENT_USER);

	const [showModal, setShowModal] = useState<boolean>(false);
	const [modalContent, setContent] = useState(<></>);
	const [modalState, setmodalState] = useState({});

	function toggleModal(state: any) {
		setmodalState(state);
		setShowModal(true);
	}

	let userId = "";
	let username = "";
	let avatarfile = "";
	if (!loading && !error) {
		userId = data.currentUserQuery.id;
		username = data.currentUserQuery.username;
		avatarfile = data.currentUserQuery.avatar.file;
	}

	const modalProps: i.ModalProps = {
		userId,
		username,
		avatarfile,
		modalState,
		toggleModal,
		showModal,
		setShowModal,
		modalContent,
		setContent,
	};
	return modalProps;
}
