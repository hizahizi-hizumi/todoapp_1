import { Link } from "@tanstack/react-router";
import {
	Alert,
	Button,
	Flex,
	Form,
	Input,
	List,
	Modal,
	Spin,
	Typography,
} from "antd";
import { useState } from "react";

import { useCreateUser } from "./services/useCreateUser";
import { useUsers } from "./services/useUsers";

const { Title } = Typography;

export function IndexPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form] = Form.useForm();

	const { users, isLoading, error } = useUsers();
	const createUser = useCreateUser();

	const handleCreate = () => {
		form.validateFields().then((values) => {
			createUser.mutate(values, {
				onSuccess: () => {
					setIsModalOpen(false);
					form.resetFields();
				},
			});
		});
	};

	return (
		<>
			<Flex vertical style={{ width: "100%", maxWidth: 600 }} gap="small">
				<Flex justify="space-between" align="center">
					<Title level={3}>Users from API</Title>
					<Button type="primary" onClick={() => setIsModalOpen(true)}>
						Create User
					</Button>
				</Flex>
				{isLoading && <Spin tip="Loading users..." />}
				{error && (
					<Alert
						message="Error"
						description={
							error instanceof Error ? error.message : "Failed to load users"
						}
						type="error"
						showIcon
					/>
				)}
				{users && (
					<List
						bordered
						dataSource={users}
						renderItem={(user) => (
							<List.Item key={user.id}>
								<List.Item.Meta title={user.name} description={user.email} />
								<Link to="/users/$id" params={{ id: String(user.id) }}>
									<Button>View Details</Button>
								</Link>
							</List.Item>
						)}
					/>
				)}

				<Flex gap="middle">
					<Link to="/">
						<Button>Home</Button>
					</Link>
					<Link to="/about">
						<Button>About</Button>
					</Link>
				</Flex>
			</Flex>

			<Modal
				title="Create New User"
				open={isModalOpen}
				onOk={handleCreate}
				onCancel={() => {
					setIsModalOpen(false);
					form.resetFields();
				}}
				confirmLoading={createUser.isPending}
			>
				<Form form={form} layout="vertical">
					(
					<Form.Item
						name="name"
						label="Name"
						rules={[{ required: true, message: "Please input the name!" }]}
					>
						<Input />
					</Form.Item>
					){" "}
					<Form.Item
						name="email"
						label="Email"
						rules={[
							{ required: true, message: "Please input the email!" },
							{ type: "email", message: "Please input a valid email!" },
						]}
					>
						<Input />
					</Form.Item>
				</Form>
				{createUser.isError && (
					<Alert
						message="Error"
						description={createUser.error?.message || "Failed to create user"}
						type="error"
						showIcon
					/>
				)}
			</Modal>
		</>
	);
}
