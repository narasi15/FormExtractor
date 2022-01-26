import React, { Component } from 'react'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Home from './components/Home';
import { Button, Navbar, Nav, NavItem, NavDropdown, MenuItem, Container } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from "prop-types";


class App extends Component {
  state = {
    selectedFile: 'http://flxtable.com/wp-content/plugins/pl-platform/engine/ui/images/image-preview.png'
  }

  constructor(props){
    super(props)
    this.state = {
      x: 0,
      y: 0, 
      isDrawOn: false
    }
    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
  }
  
  onMouseMove(e) {
    this.setState({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  }

  fileUploadHandler = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if(reader.readyState === 2){
        this.setState({selectedFile: reader.result})
      }
    }
    reader.readAsDataURL(e.target.files[0])

  }

  getCoordinates = (e) => {
    if(this.state.isDrawOn === false) {
      console.log(this.state.x, this.state.y)
    }
    
  }

  drawRects() {
    

  }

  clickHandler() {
    // change state of Draw button
    this.setState(state => ({
      isDrawOn: !state.isDrawOn
    }));
  }


  render() {
    const {selectedFile} = this.state
    const { x, y } = this.state;
    
    return(
     
    // Navigation bar tExtract
    <><Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
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
          <h1 className="heading"> Upload your training image/file</h1>
          <input type="file" name="image-upload" id="input" accept="image/*" onChange={this.fileUploadHandler}/>
          <button onClick={this.clickHandler}>
          {this.state.isDrawOn ? "Draw" : "Finish Draw"}
          </button>
          <br/>
          
          <h1>Mouse coordinates: { x } { y }</h1>


          <div className="img-holder">
            <img src={selectedFile} alt="" id="img" className="img" onMouseMove={this.onMouseMove} onClick={this.getCoordinates}/>
          </div>
          
         </div>
      </div>
    
      

        
    </>
    );
  }
 
}


export default App;
