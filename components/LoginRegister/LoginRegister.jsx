
import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { Button, TextField, Typography, Paper, Grid } from '@mui/material';
import axios from 'axios';


class LoginRegister extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			login_name: '',
			password: '',
			error: '',
			redirect: false
		};
	}

	handleInputChange = (event) => {
		this.setState({ login_name: event.target.value, error: '' });
	};

	handlePasswordChange = (event) => {
		this.setState({ password: event.target.value, error: '' });
	};

	handleSubmit = (event) => {
		event.preventDefault();
		const { login_name, password } = this.state;
		if (!login_name) {
			this.setState({ error: 'Login name required' });
			return;
		}
		if (!password) {
			this.setState({ error: 'Password required' });
			return;
		}
		axios.post('/admin/login', { login_name, password })
			.then((response) => {
				if (this.props.onLogin) {
					this.props.onLogin(response.data);
				}
				this.setState({ redirect: true });
			})
			.catch((err) => {
				let msg = 'Login failed';
				if (err.response && err.response.data) {
					msg = err.response.data;
				}
				this.setState({ error: msg });
			});
	};

	render() {
		// If already logged in, redirect to main app
		if (this.props.isLoggedIn || this.state.redirect) {
			return <Redirect to="/users" />;
		}
		return (
			<Grid container justifyContent="center" alignItems="center" style={{ minHeight: '80vh' }}>
				<Grid item xs={10} sm={6} md={4}>
					<Paper style={{ padding: 24 }}>
						<Typography variant="h5" gutterBottom>Login</Typography>
						<form onSubmit={this.handleSubmit}>
							<TextField
								label="Login Name"
								value={this.state.login_name}
								onChange={this.handleInputChange}
								fullWidth
								margin="normal"
								autoFocus
							/>
							<TextField
								label="Password"
								type="password"
								value={this.state.password}
								onChange={this.handlePasswordChange}
								fullWidth
								margin="normal"
							/>
							{this.state.error && (
								<Typography color="error" variant="body2">{this.state.error}</Typography>
							)}
							<Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: 16 }}>
								Log In
							</Button>
						</form>
					</Paper>
				</Grid>
			</Grid>
		);
	}
}

export default withRouter(LoginRegister);
