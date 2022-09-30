import React, { Component, useState } from 'react'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav,Container } from 'react-bootstrap';
import Axios from 'axios';
import * as ReactBootStrap from 'react-bootstrap'


class App extends Component {

	constructor(props) {

		super(props)

		// Contains state information for coordinates and page events
		this.state = { x: 0,
					   y: 0, 
					   clickCount: 0, 
					   boxCoords: [],
					   coords: [],
					   numberInputsFilled: 0,
					   trainImageField: false,
					   TrainImagechosen: false, 
					   getCoordinates: false, 
					   loading: false

					 }
		
		this.onMouseMove = this.onMouseMove.bind(this);

		
		
  	}
	
	// Captures coordinates on mouse hover over image
	onMouseMove(e) {
		this.setState({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  	}
	
	// Handles upload of training image only
	trainImageHandler = (e) => {

		const reader = new FileReader();
		reader.onload = () => {

			// If file is read (ie. readyState == 2), store the file
			if (reader.readyState === 2){
				this.setState({selectedFile: reader.result})
			}
		}

		// Get first uploaded file
		reader.readAsDataURL(e.target.files[0])
		this.state.trainImageField = true

		// Handle enabling of Submit Image button
		document.getElementById("submitimg").disabled = false; 

		// Handle re-enabling of Train Model button
		this.state.numberInputsFilled += 1
		if (this.state.numberInputsFilled === 2) {
			document.getElementById("train-model-btn").disabled = false;
		}
  	}
	
	// Handles upload of test images
  	testImageHandler = (e) => {
		// Handle re-enabling of Train Model button
		this.state.numberInputsFilled += 1
		if (this.state.numberInputsFilled === 2) {
			document.getElementById("train-model-btn").disabled = false;
		}
	  }
	
	// Gets selected coordinates and pushes to local client
	getCoordinates = (e) => {

      	console.log(this.state.x, this.state.y)

		// Logic for three-click box push
		// Only add coordinate to boxCoords if training image selected
		if (this.state.trainImageField === true) {
			this.state.clickCount += 1
			this.state.boxCoords.push([this.state.x, this.state.y])
		}
		

		if (this.state.clickCount % 3 === 0 && this.state.trainImageField === true) {
			this.state.coords.push(this.state.boxCoords)
			// store box coords in another variable, before resetting
			let coordinates = this.state.boxCoords
			this.state.boxCoords = []
			console.log('coords:' + JSON.stringify(this.state.coords))
			// Draw the rectangle with the 3 coordinates only if training image is selected
			if (this.state.trainImageField === true) {
				this.drawRectangle(coordinates)
			}
			
		}
  	}

	// Draw rectangle based on 3 coordinates
	drawRectangle(lst) {
		let imgCanvas = document.getElementById("canvas");
		let imgctx = imgCanvas.getContext("2d");

		// Draw rectangle
		//console.log('values: ' + lst[0][0] + ' ' + lst[0][1]);
		let xScale = 2000/1300;
		let yScale = 1000/700;
		imgctx.rect(lst[0][0] * xScale, lst[0][1] * yScale, Math.abs(lst[1][0] - lst[0][0]) * xScale, Math.abs(lst[2][1] - lst[0][1]) * yScale);
		imgctx.strokeStyle = "red";
		imgctx.stroke();
	}
	
	// Draw Canvas with Training image
    drawCanvas() {
		// set the canvas parameters
		let imgCanvas = document.getElementById("canvas");
		let imgctx = imgCanvas.getContext("2d");
		
		// Draw image to Canvas
		let img = document.getElementById("img");
		imgctx.drawImage(img, 0, 0, imgCanvas.width, imgCanvas.height);
		  
	}

	// Clear all rectangles in Canvas
	clearCanvas = (e) => {
		let canvas = document.getElementById('canvas');
		let context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Draw image to Canvas again
		let img = document.getElementById("img");
		context.drawImage(img, 0, 0, context.canvas.width, context.canvas.height);
		context.beginPath();
		
		this.state.boxCoords = []
		this.state.coords = []
		
		console.log('COORDS' + JSON.stringify(this.state.coords))
		
	}

	// Undo the last rectangle drawn on canvas
	undoRectCanvas = (e) => {

		if (this.state.coords.length > 0) {
			
			let canvas = document.getElementById('canvas');
			let context = canvas.getContext('2d');
			let xScale = 2000/1300;
			let yScale = 1000/700;

			let lastElementId = this.state.coords.length - 1

			let x = this.state.coords[lastElementId][0][0]
			let y = this.state.coords[lastElementId][0][1]
			let w = this.state.coords[lastElementId][1][0]
			let h = this.state.coords[lastElementId][2][1]

			context.clearRect(x * xScale -1, y * yScale - 1, Math.abs(w - x) * xScale + 2, Math.abs(h - y) * yScale +2);
			context.beginPath();

			this.state.coords.pop()

			// Draw image to Canvas again
			let img = document.getElementById("img");
			context.drawImage(img, 0, 0, context.canvas.width, context.canvas.height);
			context.beginPath();
			console.log("coords " + this.state.coords)

			// Redraw all the rectangles
			for (let i = 0; i < this.state.coords.length; i++) {
				this.drawRectangle(this.state.coords[i])
			}
		}
	}

	// Freeze page while sending train image to the python backside
	submitImage(e) {
		let trainImg = document.getElementById("trainImgID")
		console.log("training img " + trainImg)

		if($("#indicatorType").val() === "AccAndAgent") {

			$("#mapSlider").style.visibility = "hidden";
		
		  }


		
		// const func = async () => {
		// 	try {
		// 		const data = await Axios.get(`http://localhost:8000/api/train/coords`).then(res => {
		// 			console.log(res);
		// 			getCoordinates(true)
		// 		});
				
		// 	} catch (e) {
		// 		console.log(e);
		// 	}
		// };
	}

  	render() {
    const { selectedFile, x, y, coords, getCoordinates, loading} = this.state;
	//const [loading, setLoading] = useState(false);
	//const [coordsRetrieved, setCoordinatesRetrieved] = useState(false);

	
	// Posts coordinates to server api
    function postCoordinates(e) {

		const url = "http://localhost:8000/api/coords"
		console.dir(coords, {'maxArrayLength': null});
		
		Axios.post(url, {
			coords
		}).then(res=>{
			console.log(res.data)
		})
    }
    
    return(
     
			// Navigation bar tExtract 
			<>
				<Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
					<Container>
						<Navbar.Brand href="#home">tExtract</Navbar.Brand>
						<Navbar.Toggle aria-controls="responsive-navbar-nav" />
						<Navbar.Collapse id="responsive-navbar-nav">
							<Nav>
								<Nav.Link eventKey={2} href="#help">Help</Nav.Link>
							</Nav>
						</Navbar.Collapse>
					</Container>
				</Navbar>

				<div className="page">
					<div className="container">
					
						&nbsp;&nbsp;&nbsp;  
						<h1 className="text-center">
							Train a model to extract text from Images
						</h1>
						<h1 className="heading"> 
							Upload your training image 
						</h1>

						<form action="http://localhost:8000/api/images" method="post" encType="multipart/form-data" id="myForm1" target="http://localhost:3000">
							<div className="form-group">
								<input className="form-control" type="file" name="file" id="trainImgID" accept="image/*" required onChange={this.trainImageHandler}/>
								<button className="btn btn-info" id="submitimg" onClick={this.submitImage}>
									Submit Image 
								</button>
							</div> 
						</form> 

						&nbsp;&nbsp;&nbsp;
						<h1>
							Mouse coordinates: { x } { y }
						</h1>
						&nbsp; &nbsp; &nbsp; 
						<button className="btn btn-secondary" id="train-clear-btn"  onClick={this.clearCanvas}>
							Clear
						</button>
						&nbsp; 
						<button className="btn btn-secondary" id="train-undo-btn"  onClick={this.undoRectCanvas}>
							Undo
						</button>
						&nbsp; &nbsp; &nbsp; 
						<button className="btn btn-primary" id="newtable" onClick={this.newTable}>
							New Table
						</button>
						<div className='loader'>
						<div></div>
						</div>

				
						<canvas className='canvas' id='canvas' width='2000' height='1000' onMouseMove={this.onMouseMove} onClick={this.getCoordinates} ></canvas>
						
						<img src={selectedFile} width='1' height='1' alt="" id="img" className="img" onLoad={this.drawCanvas}/>
						
						<h3>
							Components:
						</h3>

						&nbsp;&nbsp;&nbsp;
						<h1 className="heading"> 
							Upload your test image(s)
						</h1>

					</div>
					
					<div className="container">
						<form action="http://localhost:8000/api/images" method="post" encType="multipart/form-data">
							<div className="form-group">
								<input className="form-control" type="file" name="file" id="testImgID" accept="image/*" multiple required onChange={this.testImageHandler}></input>
								<button className="btn btn-block btn-danger" id="train-model-btn" disabled onClick={postCoordinates}>
									Train Model
								</button>
							</div> 
						</form> 
					</div>
				
				</div>
			</>
    	);
  	}
}
export default App;
