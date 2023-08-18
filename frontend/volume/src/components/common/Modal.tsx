import { useState, useEffect } from "react";
import "../../styles/style.css";
import * as i from "../../types/Interfaces";
import { gql, useQuery } from "@apollo/client";
import Manuel from "../Manual";
import SettingsModal from "../settings/SettingsModal";
import ChangePrivileges from "../chat/ChangePrivileges";
import GroupStats from "../chat/GroupStats";
import ChangePassword from "../chat/ChangePassword";
import UserStats from "./UserStats";
import NewChat from "../chat/NewChat";
import JoinChannel from "../chat/JoinChannel";
import CreateChannel from "../chat/CreateChannel";

export default function Modal(props: i.ModalProps) {
	const closeModal = () => {
		props.setShowModal(false);
		window.history.pushState(null, "", "home");
	};

	useEffect(() => {
		setModalContent(props.modalState.type, props);

		if (props.showModal) {
			const serializableModalState = props.modalState;
			for (const key in serializableModalState) {
				if (typeof serializableModalState[key] === "function")
					delete serializableModalState[key];
			}
			if (props.modalState.type != undefined)
				window.history.pushState(
					serializableModalState,
					"",
					`home?${props.modalState.type}`
				);
		}

		const handlePopstate = (event: PopStateEvent) => {
			const modalState = event.state;
			if (modalState) {
				props.setShowModal(true);
				setModalContent(modalState.type, props);
			} else {
				props.setShowModal(false);
			}
		};

		// Listen for popstate events whenever the component is mounted
		window.addEventListener("popstate", handlePopstate);

		// Clean up the event listener when the component is unmounted
		return () => {
			window.removeEventListener("popstate", handlePopstate);
		};
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

function setModalContent(type: string, props: any) {
	switch (type) {
		case "Manuel":
			props.setContent(<Manuel />);
			break;
		case "GroupStats":
			props.setContent(
				<GroupStats {...props} setChatState={props.modalState.setChatState} />
			);
			break;
		case "SettingsModal":
			props.setContent(<SettingsModal {...props} user={props.modalState.user} />);
			break;
		case "ChangePrivileges":
			props.setContent(
				<ChangePrivileges {...props} setChatState={props.modalState.setChatState} />
			);
			break;
		case "ChangePassword":
			props.setContent(<ChangePassword {...props} />);
			break;
		case "UserStats":
			props.setContent(<UserStats {...props} selectedUser={props.modalState.selectedUser} />);
			break;
		case "NewChat":
			props.setContent(<NewChat {...props} setShowModal={props.modalState.setShowModal} />);
			break;
		case "JoinChannel":
			props.setContent(<JoinChannel {...props} />);
			break;
		case "CreateChannel":
			props.setContent(<CreateChannel {...props} />);
			break;
		default:
			// console.log("Unexpected type", type);
			break;
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

function useUser() {
	const { loading, error, data } = useQuery(CURRENT_USER);
	let userId = "";
	let username = "";
	let avatarfile = "";

	if (!loading && !error) {
		userId = data.currentUserQuery.id;
		username = data.currentUserQuery.username;
		avatarfile = data.currentUserQuery.avatar.file;
	}

	return { userId, username, avatarfile, loading, error };
}

export function createModalProps(): i.ModalProps {
	const { userId, username, avatarfile } = useUser();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [modalContent, setContent] = useState(<></>);
	const [modalState, setmodalState] = useState({});
	const [selectedGroup, setSelectedGroup] = useState({});

	function toggleModal(state: any) {
		setmodalState(state);
		setShowModal(true);
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
		selectedGroup,
		setSelectedGroup,
	};
	return modalProps;
}
