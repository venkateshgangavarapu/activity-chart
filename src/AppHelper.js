//App helper library
//REQUIRES D3 to be loaded on page to function
export default class AppHelper{
	

	//Generic
	getWidth(){
		return window.innerWidth|| document.documentElement.clientWidth|| document.body.clientWidth;
	}
    getHeight(){
		return window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
	}


}
