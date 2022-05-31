/*React*/
import { useEffect, useState, useRef } from 'react';
/*For time formatting*/
import Moment from 'react-moment';
/*Pages*/
import Header from './Header';
import '../index.css';
import {useAuth} from '../auth/AuthContext';
/*Material*/
import { TextField, Box, Grid, Container, Button, CssBaseline, Typography, CircularProgress, Backdrop, Alert, Card, CardContent, CardActions, Menu, IconButton, MenuItem, Slide } from '@mui/material';
import { Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions } from '@mui/material';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import MoreVert from '@mui/icons-material/MoreVert';
import Search from '@mui/icons-material/Search';
import EmojiEmotions from '@mui/icons-material/EmojiEmotions';
import AccessTimeFilled from '@mui/icons-material/AccessTimeFilled';

const Home = () => {

    const currentUser = useAuth(); //Get currentUser details
    const [userDetails, setUserDetails] = useState({ email: '', displayName: '' }); //Set current User details
    const [allContentsArray, setAllContentsArray] = useState([]); //For all contents array
    const [showAddContent, setShowAddContent] = useState(false);
    const [editContentArray, setEditContentArray] = useState({ contentTitle: '', contentDate: '', contentDetails: '' });//for getting data in edit dialog
    const [searchContentArray, setSearchContentArray] = useState({ contentTitle: '', contentDate: '', contentDetails: '' });//for getting data in edit dialog
    const [contentID, setContentID] = useState();//Setting document id from firestore
    const [deleteDialog, setDeleteDialog] = useState(false); //For getting delete content Dialog
    const [editDialog, setEditDialog] = useState(false); //For getting edit content Dialog
    const todayDate = new Date().toISOString().substring(0, 10);//Get current Date
    const [addContentErrors, setAddContentErrors] = useState({ contentDate: '', contentTitle: '' }); //For showing errors while adding contents
    const [content, setContent] = useState({ contentDate: todayDate, contentTitle: '', contentDetails: '' }); //Setting content data in add content dialog
    const [loading, setLoading] = useState(true); //For loader
    const [searchLoading, setSearchLoading] = useState(false); //For search loader
    const [alert, setAlert] = useState({ alertName: '', alertSeverity: '' }); //Setting alert for events
    const [loadingBackDrop, setLoadingBackdrop] = useState(false);//Full screen loader
    const [anchorElNav, setAnchorElNav] = useState(null); //Anchor El tag in card-dot-menu
    //const handleOpenMenu = (event) => { setAnchorElNav(event.currentTarget); };//Open Menu
    //const handleCloseMenu = () => { setAnchorElNav(null); };//Close Menu
    const [ellipsisUsedArray, setEllipsisUsedArray] = useState([]); //Contains contents that are removed from ellipsis styling
    const [menuUsedArray, setMenuUsedArray] = useState([]); //Contains ids of menu opened
    const addContentFormRef = useRef(); //Add Content Form Ref for slide animation
    const [searchBox, setSearchBox] = useState(false); //Outputs of searched query
    const [searchInput,setSearchInput] = useState(''); //Input for Search
    
    //Check for user details changes
    useEffect(() => {
        setUserDetails({ email: currentUser.currentUser.email, displayName: currentUser.currentUser.displayName });
        return () => setUserDetails([]); //Cleanup function
    }, [currentUser.currentUser]);

    //Check if content data changes
    useEffect(() => {
        //all contents query
        const allContentQuery = query(collection(getFirestore(), "contents"), where("email", "==", currentUser.currentUser.email), orderBy("contentDate","desc"));
        onSnapshot(allContentQuery, (snapshot) => {
            setAllContentsArray(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
            setLoading(false);
        });
        return setAllContentsArray([]); //Cleanup function
    }, [currentUser.currentUser.email]);

    //Check if search content data changes
    useEffect(() => {
        async function searchCheck() {
            setSearchLoading(true);
            try {
                const searchQuery = query(collection(getFirestore(), "contents"), where("email", "==", currentUser.currentUser.email), where("contentTitle", ">=", searchInput.toUpperCase()), where("contentTitle", "<=", searchInput.toUpperCase() + '\uf8ff'));
                const searchQuerySnapshot = await getDocs(searchQuery);
                setSearchContentArray(searchQuerySnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
                setSearchLoading(false); //Clear Search 
            } catch (e) {
                setSearchLoading(false); //Clear Search 
                setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
                console.log(e);
                setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
            }
        }
        searchBox && searchCheck();
        return setSearchContentArray([]); //Cleanup function
    }, [searchBox, currentUser.currentUser.email,searchInput]);
    
    //Onchange events for add content form
    const handleChange = (event) => {
        setAddContentErrors({ contentTitle: '', contentDate: '', contentDetails: '' }); // Clearing Old validations
        if (event.target.id === 'contentTitle') {
            setContent({ contentTitle: event.target.value, contentDate: content.contentDate, contentDetails: content.contentDetails });
        } else if (event.target.id === 'contentDate') {
            setContent({ contentDate: event.target.value, contentTitle: content.contentTitle, contentDetails: content.contentDetails });
        } else if (event.target.id === 'contentDetails') {
            setContent({ contentDetails: event.target.value, contentTitle: content.contentTitle, contentDate: content.contentDate });
        }
    }

    //Validate add content inputs
    const addContent = (event) => {
        event.preventDefault();
        setAddContentErrors({ contentDate: '', contentTitle: '', contentDetails: '' });//Clearing old Validation errors
        if (content.contentDate === '') {
            setAddContentErrors({ contentTitle: '', contentDate: 'Please enter the date..', contentDetails: '' });
        } else if (content.contentTitle === '') {
            setAddContentErrors({ contentTitle: 'How would you call this day?', contentDate: '', contentDetails: '' });
        } else if (content.contentDetails === '') {
            setAddContentErrors({ contentTitle: '', contentDate: '', contentDetails: 'Please enter any details about the day..' });
        } else {
            addContentInFirestoreFn(content.contentTitle, content.contentDate, content.contentDetails);
            setContent({ contentTitle: '', contentDetails: '', contentDate: content.contentDate });
        }
    }

    //Add Content to Firestore
    async function addContentInFirestoreFn(contentTitle, contentDate, contentDetails) {
        setLoadingBackdrop(true);
        try {
            await addDoc(collection(getFirestore(), "contents"), { contentTitle: contentTitle, contentDate: contentDate, contentDetails: contentDetails, email: currentUser.currentUser.email });
            setLoadingBackdrop(false);
            setShowAddContent(false);
            setAlert({ alertName: 'Content Added Successfully!', alertSeverity: 'success' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' })},5000);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: '+e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
    }

    //Show Add Content
    const toggleAddContentForm = (e) => {
        setShowAddContent(e);
    }

    //Get required Content for Editing
    async function showEditContent(currentContentId) {
        try {
            setLoadingBackdrop(true);
            const q = query(doc(getFirestore(), "contents", currentContentId));
            const querySnap = await getDoc(q);
            setEditContentArray({ contentTitle: querySnap.data().contentTitle, contentDate: querySnap.data().contentDate, contentDetails: querySnap.data().contentDetails });
            setContentID(currentContentId);
            setEditDialog(true);
            setLoadingBackdrop(false);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
    }
    //Check Edited Inputs
    const checkEditInput = (event) => {
        if (event.target.id === 'editContentTitle') {
            setEditContentArray({ contentTitle: event.target.value, contentDate: editContentArray.contentDate, contentDetails: editContentArray.contentDetails });
        } else if (event.target.id === 'editContentDate') {
            setEditContentArray({ contentTitle: editContentArray.contentTitle, contentDate: event.target.value, contentDetails: editContentArray.contentDetails });
        } else if (event.target.id === 'editContentDetails') {
            setEditContentArray({ contentTitle: editContentArray.contentTitle, contentDate: editContentArray.contentDate, contentDetails: event.target.value });
        }
    }
    //Edit Contents
    async function editContent(id) {
        try {
            setLoadingBackdrop(true);
            const updateItem = doc(getFirestore(), "contents", id);
            await updateDoc(updateItem, {
                contentTitle: editContentArray.contentTitle,
                contentDetails: editContentArray.contentDetails
            });
            setLoadingBackdrop(false);
            setEditDialog(false);
            setAlert({ alertName: 'Content was edited successfully!', alertSeverity: 'info' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 5000);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
    }

    //Delete Content Function
    async function deleteContent(id) {
        try {
            setLoadingBackdrop(true);
            await deleteDoc(doc(getFirestore(), "contents", id));
            setContentID(null);
            setLoadingBackdrop(false);
            setDeleteDialog(false);
            setAlert({ alertName: 'Content was deleted successfully!', alertSeverity: 'success' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 5000);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
    }

    //Search Contents
    async function handleSearch(e) {
        setSearchInput(e.target.value);
        searchInput === "" ? setSearchLoading(false) : setSearchLoading(true);
    }

    return (  
        <div>
            <Header />
            {/*Backdrop full screen loader*/}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loadingBackDrop}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <CssBaseline />
            <Container>
                {/*Add Content*/}
                <Card raised={true} sx={{ bgcolor: 'teal[50]', mt: 2, px: 2, py: 3 }} ref={addContentFormRef}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Grid container alignItems="center">
                            <Grid item><IconButton><EmojiEmotions fontSize="large" color="success" /></IconButton></Grid>
                            <Grid item><Typography variant="h5">Hello {userDetails.displayName}!</Typography></Grid>
                        </Grid>
                        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box><IconButton onClick={() => { setSearchBox(!searchBox); }}><Search /></IconButton></Box>
                        </Grid>
                    </Box>
                    <Box>
                        {searchBox && <Box><TextField onChange={(e) => {handleSearch(e)}} label="Search for Content" variant="filled" color="secondary" fullWidth autoFocus margin="dense" /></Box>}
                    </Box>
                    {alert.alertName && <Alert severity={alert.alertSeverity} onClose={() => setAlert([]) }>{alert.alertName}</Alert>}
                    <TextField id="contentDetails" label="How was today?" multiline minRows={2} maxRows={7} value={content.contentDetails} onChange={(e)=>handleChange(e)} fullWidth margin="normal" onClick={() => toggleAddContentForm(true)} />
                    {showAddContent &&
                        <Slide in={showAddContent} direction="left" container={addContentFormRef.current}>
                            <div>
                                <TextField required type="date" id="contentDate" label="Date" InputLabelProps={{ shrink: true }} value={content.contentDate} onChange={handleChange} error={addContentErrors.contentDate !== ''} helperText={addContentErrors.contentDate === '' ? '' : addContentErrors.contentDate} />
                                <TextField required id="contentTitle" label="Title for this day" value={content.contentTitle} onChange={handleChange} error={addContentErrors.contentTitle !== ''} helperText={addContentErrors.contentTitle === '' ? '' : addContentErrors.contentTitle} /><br/><br/>
                                <Button variant="contained" sx={{ mr: 1 }} onClick={addContent}>ADD</Button>
                                <Button variant="outlined" color="error" onClick={() => setShowAddContent(false)}>CLOSE</Button>
                            </div>
                        </Slide>
                    }
                </Card>
                {/*Search Content*/}
                <Box>
                    {
                        searchLoading ?
                            searchBox && <CircularProgress /> :
                            searchBox &&
                                (searchContentArray.length > 0) ?
                                searchContentArray.map(({ id, data }) => (
                                    <Slide key={id} direction="up" in={!searchLoading}>
                                        <Card key={id} sx={{ bgcolor: 'blue[50]', my: 1, border:"2px solid" }} >
                                        <CardContent sx={{pb:0,mb:0}}>
                                            {/*Card Header*/}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Grid container alignItems="center" direction="row">
                                                    <Grid item sx={{ mr: 2 }}>
                                                        <IconButton><AccessTimeFilled fontSize="large" color="primary"/></IconButton>
                                                    </Grid>
                                                    <Grid item>
                                                        <Box>
                                                            <Typography variant="h5" sx={{ textTransform: "uppercase" }}>{data.contentTitle}</Typography>
                                                            <Typography variant="body2"><Moment format="DD-MMM-YYYY (ddd)">{data.contentDate}</Moment></Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                                <Grid><IconButton key={'menuButton' + id} aria-label="more" aria-controls={Boolean(anchorElNav) ? 'long-menu' + id : undefined} aria-haspopup="true" aria-expanded={Boolean(anchorElNav) ? 'true' : undefined} onClick={(e) => { if (menuUsedArray.indexOf(id) < 0) { setMenuUsedArray(menuUsedArray => [...menuUsedArray, id]); setAnchorElNav(e.currentTarget); } else { menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); } }}><MoreVert /></IconButton></Grid>
                                            </Box>
                                            {/*Menu of Edit, Delete of each card*/}
                                            <Menu key={'menuItemsDiv' + id} id={'long-menu' + id} anchorEl={menuUsedArray.indexOf(id) < 0 ? null : anchorElNav} open={menuUsedArray.indexOf(id) < 0 ? false : Boolean(anchorElNav)} onClose={() => { menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }} >
                                                <MenuItem key={'editMenu' + id}><Typography onClick={() => { setLoadingBackdrop(true); showEditContent(id); menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Edit</Typography></MenuItem>
                                                <MenuItem key={'deleteMenu' + id}><Typography onClick={() => { setDeleteDialog(true); setContentID(id); menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); } }>Delete</Typography></MenuItem>
                                            </Menu>
                                            {/*Card Content*/}
                                            <br/><Typography className={ellipsisUsedArray.indexOf(id) < 0 ? 'ellipsisStyle' : 'noEllipsisStyle' } variant="body1" id={"contentDetailsIDof" + id} sx={{ whiteSpace: 'pre' }} >{data.contentDetails}</Typography>
                                        </CardContent>
                                        <CardActions disableSpacing>
                                            {/*See More or See Less Buttons*/}
                                            <Button size="small" onClick={() => { if (ellipsisUsedArray.indexOf(id) < 0) { setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, id]) } else { ellipsisUsedArray.splice(ellipsisUsedArray.indexOf(id), 1); setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, ellipsisUsedArray]); } }}>
                                                { (ellipsisUsedArray.indexOf(id) < 0) ? 'More' : 'Less' }
                                            </Button>
                                        </CardActions>
                                    </Card>
                                    </Slide>
                                )) :
                                searchBox && <div> No results found.. </div>
                    }
                </Box>
                {/*Show Content*/}
                <Box sx={{ py: 3 }}>
                    {
                        loading ? <CircularProgress /> :
                            (allContentsArray.length > 0) ?
                                allContentsArray.map(({ id, data }) => (
                                    <Slide key={id} direction="up" in={!loading}>
                                        <Card key={id} sx={{ bgcolor: 'blue[50]', my: 1 }} >
                                            <CardContent sx={{ pb: 0, mb: 0 }}>
                                                {/*Card Header*/}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Grid container alignItems="center" direction="row">
                                                        <Grid item sx={{ mr: 2 }}>
                                                            <IconButton><AccessTimeFilled fontSize="large" color="primary" /></IconButton>
                                                        </Grid>
                                                        <Grid item>
                                                            <Box>
                                                                <Typography variant="h5" sx={{ textTransform: "uppercase" }}>{data.contentTitle}</Typography>
                                                                <Typography variant="body2"><Moment format="DD-MMM-YYYY (ddd)">{data.contentDate}</Moment></Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid><IconButton key={'menuButton' + id} aria-label="more" aria-controls={Boolean(anchorElNav) ? 'long-menu' + id : undefined} aria-haspopup="true" aria-expanded={Boolean(anchorElNav) ? 'true' : undefined} onClick={(e) => { if (menuUsedArray.indexOf(id) < 0) { setMenuUsedArray(menuUsedArray => [...menuUsedArray, id]); setAnchorElNav(e.currentTarget); } else { menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); } }}><MoreVert /></IconButton></Grid>
                                                </Box>
                                                {/*Menu of Edit, Delete of each card*/}
                                                <Menu key={'menuItemsDiv' + id} id={'long-menu' + id} anchorEl={menuUsedArray.indexOf(id) < 0 ? null : anchorElNav} open={menuUsedArray.indexOf(id) < 0 ? false : Boolean(anchorElNav)} onClose={() => { menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }} >
                                                    <MenuItem key={'editMenu' + id}><Typography onClick={() => { setLoadingBackdrop(true); showEditContent(id); menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Edit</Typography></MenuItem>
                                                    <MenuItem key={'deleteMenu' + id}><Typography onClick={() => { setDeleteDialog(true); setContentID(id); menuUsedArray.splice(menuUsedArray.indexOf(id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Delete</Typography></MenuItem>
                                                </Menu>
                                                {/*Card Content*/}
                                                <br /><Typography className={ellipsisUsedArray.indexOf(id) < 0 ? 'ellipsisStyle' : 'noEllipsisStyle'} variant="body1" id={"contentDetailsIDof" + id} sx={{ whiteSpace: 'pre-line' }} >{data.contentDetails}</Typography>
                                            </CardContent>
                                            <CardActions disableSpacing>
                                                {/*See More or See Less Buttons*/}
                                                <Button size="small" onClick={() => { if (ellipsisUsedArray.indexOf(id) < 0) { setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, id]) } else { ellipsisUsedArray.splice(ellipsisUsedArray.indexOf(id), 1); setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, ellipsisUsedArray]); } }}>
                                                    {(ellipsisUsedArray.indexOf(id) < 0) ? 'More' : 'Less'}
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Slide>
                                )) :
                                <div>No contents found.. </div>
                    }
                </Box>
                {/*Edit Dialog*/}
                <Dialog open={editDialog} onClose={() => setEditDialog(false)} fullWidth maxWidth='sm' >
                    <DialogTitle>Edit Content</DialogTitle>
                    <DialogContent>
                        <TextField id="editContentTitle" label="Title" margin="normal" fullWidth value={editContentArray.contentTitle} onChange={checkEditInput} autoFocus></TextField>
                        <TextField type="date" id="editContentDate" label="Date" margin="normal" fullWidth value={editContentArray.contentDate} onChange={checkEditInput} autoFocus></TextField>
                        <TextField id="editContentDetails" label="Details" margin="normal" fullWidth multiline rows={7} value={editContentArray.contentDetails} onChange={checkEditInput} ></TextField>
                    </DialogContent>
                    <DialogActions sx={{ pb: 2 }}>
                        <Button variant="contained" color="success" onClick={() => editContent(contentID)}>Done</Button>
                        <Button variant="outlined" color="error" onClick={() => setEditDialog(false)}>Cancel</Button>
                    </DialogActions>
                </Dialog>
                {/*Delete Dialog*/}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} fullWidth maxWidth='md' >
                    <DialogTitle>Delete Content</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Do you really want to delete this Content permanently?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ pb: 2 }}>
                        <Button variant="contained" color="error" onClick={() => deleteContent(contentID)}>Delete</Button>
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)}>Cancel </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
}

export default Home;