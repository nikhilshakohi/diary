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
import { addDoc, collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import MoreVert from '@mui/icons-material/MoreVert';
import Search from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEmotions from '@mui/icons-material/EmojiEmotions';
import AccessTimeFilled from '@mui/icons-material/AccessTimeFilled';
import { LoadingButton } from '@mui/lab';

const Home = () => {

    const currentUser = useAuth(); //Get currentUser details
    const [userDetails, setUserDetails] = useState({ email: '', displayName: '' }); //Set current User details
    const [allContentsArray, setAllContentsArray] = useState([]); //For all contents array
    const [showAddContent, setShowAddContent] = useState(false);
    //const [editContentArray, setEditContentArray] = useState({ editContentTitle: '', editContentDate: '', editContentDetails: '' });//for getting data in edit dialog
    const [filteredContentArray, setFilteredContentArray] = useState([]);//for getting data in edit dialog
    const [contentID, setContentID] = useState();//Setting document id from firestore
    const [deleteDialog, setDeleteDialog] = useState(false); //For getting delete content Dialog
    const [editDialog, setEditDialog] = useState(false); //For getting edit content Dialog
    const todayDate = new Date().toISOString().substring(0, 10);//Get current Date
    const [addContentErrors, setAddContentErrors] = useState({ contentDate: '', contentTitle: '' }); //For showing errors while adding contents
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
    const contentTitleRef = useRef();//Ref for contentDetails (instead of changing state everytime details box is typed)
    const contentDateRef = useRef();//Ref for contentDetails (instead of changing state everytime details box is typed)
    const contentDetailsRef = useRef();//Ref for contentDetails (instead of changing state everytime details box is typed)
    const editContentDateRef = useRef();    //Ref for edit dialog input Date
    const editContentTitleRef = useRef();    //Ref for edit dialog input Title
    const editContentDetailsRef = useRef();    //Ref for edit dialog input Details
    const searchWordRef = useRef(); //To improve speed
    const [searchedWord, setSearchedWord] = useState("");    //For search results count

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
            setAllContentsArray(snapshot.docs.map((doc) => ({ id: doc.id, contentDate: doc.data().contentDate, contentTitle: doc.data().contentTitle, contentDetails: doc.data().contentDetails, })));
            setLoading(false);
        });
        return setAllContentsArray([]); //Cleanup function
    }, [currentUser.currentUser.email]);

    //Optimized Search using debounce
    const searchDebouncer = (func, delay) => {
        let timer;  //Declaring a timer for maintaining and clearing onchange
        return function() {
            const context = this;
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(context);
            }, delay);
        }
    }
    const handleSearchDebounced = searchDebouncer(handleSearch, 500);

    //Filter Searched Results
    async function handleSearch() {
        var searchWord = searchWordRef.current.value.toLowerCase();
        setSearchLoading(true);
        const newSearchContentArray = allContentsArray.filter(
            (item) => {
                return item.contentTitle.toLowerCase().includes(searchWord) || item.contentDate.includes(searchWord) || item.contentDetails.toLowerCase().includes(searchWord);
            }
        );
        searchWord !== "" ? setFilteredContentArray(newSearchContentArray) : setFilteredContentArray([]);
        setSearchedWord(searchWord);
        setSearchLoading(false); //Clear Search Loader
    }

    //Validate add content inputs
    const addContent = (event) => {
        event.preventDefault();
        var cTitle = contentTitleRef.current.value;
        var cDetails = contentDetailsRef.current.value;
        var cDate = contentDateRef.current.value;
        setAddContentErrors({ contentDate: '', contentTitle: '', contentDetails: '' });//Clearing old Validation errors
        if (cDate === '') {
            setAddContentErrors({ contentTitle: '', contentDate: 'Please enter the date..', contentDetails: '' });
            contentDateRef.current.focus();
        } else if (cTitle === '') {
            setAddContentErrors({ contentTitle: 'How would you call this day?', contentDate: '', contentDetails: '' });
            contentTitleRef.current.focus();
        }else {
            addContentInFirestoreFn(cTitle, cDate, cDetails);
            document.getElementById("contentDetails").value = '';
            contentTitleRef.current.value = ""; contentDetailsRef.current.value = ""; //Clearing value
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
        !showAddContent && setShowAddContent(e);
    }

    //Get required Content for Editing
    async function showEditContent(currentContentId) {
        setEditDialog(true);
        try {
            setLoadingBackdrop(true);
            const q = query(doc(getFirestore(), "contents", currentContentId));
            const querySnap = await getDoc(q);
            //setEditContentArray({ editContentTitle: querySnap.data().contentTitle, editContentDate: querySnap.data().contentDate, editContentDetails: querySnap.data().contentDetails });
            setContentID(currentContentId);
            editContentTitleRef.current.value = querySnap.data().contentTitle;
            editContentDateRef.current.value = querySnap.data().contentDate;
            editContentDetailsRef.current.value = querySnap.data().contentDetails;
            setLoadingBackdrop(false);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
    }
    //Check Edited Inputs
    /*const checkEditInput = (event) => {
        setEditContentArray({ ...editContentArray, [event.target.id]: event.target.value });
    }*/
    //Edit Contents
    async function editContent(id) {
        try {
            setLoadingBackdrop(true);
            setEditDialog(false);
            setAlert({ alertName: 'Content was edited successfully!', alertSeverity: 'info' });
            const updateItem = doc(getFirestore(), "contents", id);
            await updateDoc(updateItem, {
<<<<<<< HEAD
                contentTitle: editContentArray.contentTitle,
                contentDetails: editContentArray.contentDetails
=======
                contentTitle: editContentTitleRef.current.value,
                contentDate: editContentDateRef.current.value,
                contentDetails: editContentDetailsRef.current.value
>>>>>>> 235d3b9 (fixes and improvements)
            });
            setLoadingBackdrop(false);
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
            setDeleteDialog(false);
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Content was deleted successfully!', alertSeverity: 'success' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 5000);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 10000);
        }
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
                            <Grid item><Typography id="welcomeName" variant="h5">Hello {userDetails.displayName}!</Typography></Grid>
                        </Grid>
                        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                            {
                                searchBox ?
                                    <Box><IconButton onClick={() => { setSearchBox(false); }}><CancelIcon /></IconButton></Box> :
                                    <Box><IconButton onClick={() => { setSearchBox(!searchBox); }}><Search /></IconButton></Box>
                            }
                        </Grid>
                    </Box>
                    <Box>
                        {
                            searchBox &&
                            <Box>
                                <TextField inputRef={searchWordRef} onChange={() => { handleSearchDebounced() }} label="Search for Content" variant="filled" color="secondary" fullWidth autoFocus margin="dense" />
                                {(searchedWord === "" ? <Typography variant="subtitle2"> type something you remember... </Typography> : <Typography variant="subtitle2"> {filteredContentArray.length} results found.. </Typography>)}
                            </Box>
                        }
                    </Box>
                    {alert.alertName && <Alert severity={alert.alertSeverity} onClose={() => setAlert([])}>{alert.alertName}</Alert>}
                    {!searchBox && <TextField id="contentDetails" inputRef={contentDetailsRef} label="How was today?" multiline minRows={2} maxRows={7} /*value={content.contentDetails}*/ onChange={() => toggleAddContentForm(true)} fullWidth margin="normal" InputLabelProps={{ shrink: showAddContent }} onClick={() => toggleAddContentForm(true)} />}
                    {
                        !searchBox && showAddContent &&
                        <Slide in={showAddContent} direction="left" container={addContentFormRef.current}>
                        <div>
                            <TextField id="contentDate" defaultValue={todayDate} inputRef={contentDateRef} required type="date" label="Date" InputLabelProps={{ shrink: true }} /*value={todayDate} onChange={handleChange}*/ error={addContentErrors.contentDate !== ''} helperText={addContentErrors.contentDate === '' ? '' : addContentErrors.contentDate} />
                            <TextField id="contentTitle" inputRef={contentTitleRef} required label="Title for this day" /*value={content.contentTitle} onChange={handleChange}*/ error={addContentErrors.contentTitle !== ''} helperText={addContentErrors.contentTitle === '' ? '' : addContentErrors.contentTitle} /><br/><br/>
                            <Button variant="contained" sx={{ mr: 1 }} onClick={(e) => { addContent(e) }}>ADD</Button>
                                <Button variant="outlined" color="error" onClick={() => setShowAddContent(false)}>CLOSE</Button>
                            </div>
                        </Slide>
                    }
                </Card>
                {/*Search Content*/}
                <Box>
                    {/*Display Search Results*/}
                    {
                        searchLoading ?
                            searchBox && <CircularProgress /> :
                            searchBox && 
                                (filteredContentArray.length > 0) &&
                                filteredContentArray.map((item) => (
                                    <Slide key={item.id} direction="up" in={!searchLoading}>
                                        <Card key={item.id} sx={{ bgcolor: 'blue[50]', my: 1, border:"2px solid" }} >
                                        <CardContent sx={{pb:0,mb:0}}>
                                            {/*Card Header*/}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Grid container alignItems="center" direction="row">
                                                    <Grid item sx={{ mr: 2 }}>
                                                        <IconButton><AccessTimeFilled fontSize="large" color="primary"/></IconButton>
                                                    </Grid>
                                                    <Grid item>
                                                        <Box>
                                                            <Typography variant="h5" sx={{ textTransform: "uppercase" }}>{item.contentTitle}</Typography>
                                                            <Typography variant="body2"><Moment format="DD-MMM-YYYY (ddd)">{item.contentDate}</Moment></Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                                    <Grid><IconButton key={'menuButton' + item.id} aria-label="more" aria-controls={Boolean(anchorElNav) ? 'long-menu' + item.id : undefined} aria-haspopup="true" aria-expanded={Boolean(anchorElNav) ? 'true' : undefined} onClick={(e) => { if (menuUsedArray.indexOf(item.id) < 0) { setMenuUsedArray(menuUsedArray => [...menuUsedArray, item.id]); setAnchorElNav(e.currentTarget); } else { menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); } }}><MoreVert /></IconButton></Grid>
                                            </Box>
                                            {/*Menu of Edit, Delete of each card*/}
                                                <Menu key={'menuItemsDiv' + item.id} id={'long-menu' + item.id} anchorEl={menuUsedArray.indexOf(item.id) < 0 ? null : anchorElNav} open={menuUsedArray.indexOf(item.id) < 0 ? false : Boolean(anchorElNav)} onClose={() => { menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }} >
                                                    <MenuItem key={'editMenu' + item.id}><Typography onClick={() => { setLoadingBackdrop(true); showEditContent(item.id); menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Edit</Typography></MenuItem>
                                                    <MenuItem key={'deleteMenu' + item.id}><Typography onClick={() => { setDeleteDialog(true); setContentID(item.id); menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); } }>Delete</Typography></MenuItem>
                                            </Menu>
                                            {/*Card Content*/}
                                                <br /><Typography className={ellipsisUsedArray.indexOf(item.id) < 0 ? 'ellipsisStyle' : 'noEllipsisStyle'} variant="body1" id={"contentDetailsIDof" + item.id} sx={{ whiteSpace: 'pre-line' }} >{item.contentDetails}</Typography>
                                        </CardContent>
                                        <CardActions disableSpacing>
                                            {/*See More or See Less Buttons*/}
                                                <Button size="small" onClick={() => { if (ellipsisUsedArray.indexOf(item.id) < 0) { setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, item.id]) } else { ellipsisUsedArray.splice(ellipsisUsedArray.indexOf(item.id), 1); setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, ellipsisUsedArray]); } }}>
                                                    {(ellipsisUsedArray.indexOf(item.id) < 0) ? 'More' : 'Less' }
                                            </Button>
                                        </CardActions>
                                    </Card>
                                    </Slide>
                                ))
                    }
                </Box>
                {/*Show Content*/}
                <Box sx={{ py: 3 }}>
                    {
                        loading ? <CircularProgress /> :
                            (allContentsArray.length > 0) ?
                                allContentsArray.map((data) => (
                                    <Slide key={data.id} direction="up" in={!loading}>
                                        <Card key={data.id} sx={{ bgcolor: 'blue[50]', my: 1 }} >
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
                                                                <Box sx={{display:'inline-flex', flexDirection:'row'}}>
                                                                    <Typography variant="body2"><Moment format="DD-MMM-YYYY (ddd)">{data.contentDate}</Moment></Typography>
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid><IconButton key={'menuButton' + data.id} aria-label="more" aria-controls={Boolean(anchorElNav) ? 'long-menu' + data.id : undefined} aria-haspopup="true" aria-expanded={Boolean(anchorElNav) ? 'true' : undefined} onClick={(e) => { if (menuUsedArray.indexOf(data.id) < 0) { setMenuUsedArray(menuUsedArray => [...menuUsedArray, data.id]); setAnchorElNav(e.currentTarget); } else { menuUsedArray.splice(menuUsedArray.indexOf(data.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); } }}><MoreVert /></IconButton></Grid>
                                                </Box>
                                                {/*Menu of Edit, Delete of each card*/}
                                                <Menu key={'menuItemsDiv' + data.id} id={'long-menu' + data.id} anchorEl={menuUsedArray.indexOf(data.id) < 0 ? null : anchorElNav} open={menuUsedArray.indexOf(data.id) < 0 ? false : Boolean(anchorElNav)} onClose={() => { menuUsedArray.splice(menuUsedArray.indexOf(data.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }} >
                                                    <MenuItem key={'editMenu' + data.id}><Typography onClick={() => { setLoadingBackdrop(true); showEditContent(data.id); menuUsedArray.splice(menuUsedArray.indexOf(data.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Edit</Typography></MenuItem>
                                                    <MenuItem key={'deleteMenu' + data.id}><Typography onClick={() => { setDeleteDialog(true); setContentID(data.id); menuUsedArray.splice(menuUsedArray.indexOf(data.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Delete</Typography></MenuItem>
                                                </Menu>
                                                {/*Card Content*/}
                                                <br /><Typography className={ellipsisUsedArray.indexOf(data.id) < 0 ? 'ellipsisStyle' : 'noEllipsisStyle'} variant="body1" id={"contentDetailsIDof" + data.id} sx={{ whiteSpace: 'pre-line' }} >{data.contentDetails}</Typography>
                                            </CardContent>
                                            <CardActions disableSpacing>
                                                {/*See More or See Less Buttons*/}
                                                <Button size="small" onClick={() => { if (ellipsisUsedArray.indexOf(data.id) < 0) { setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, data.id]) } else { ellipsisUsedArray.splice(ellipsisUsedArray.indexOf(data.id), 1); setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, ellipsisUsedArray]); } }}>
                                                    {(ellipsisUsedArray.indexOf(data.id) < 0) ? 'More' : 'Less'}
                                                </Button>
                                                {/*Number of words*/}
                                                <Typography variant="caption">&nbsp;({data.contentDetails.split(' ').length} words)</Typography>
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
                        <TextField inputRef={editContentTitleRef} id="editContentTitle" label="Title" margin="normal" fullWidth /*value={editContentArray.editContentTitle} onChange={checkEditInput}*/ InputLabelProps={{ shrink: editDialog && !loadingBackDrop }} ></TextField>
                        <TextField inputRef={editContentDateRef} type="date" id="editContentDate" label="Date" margin="normal" fullWidth /*value={editContentArray.editContentDate} onChange={checkEditInput}*/ InputLabelProps={{ shrink: editDialog && !loadingBackDrop }} ></TextField>
                        <TextField inputRef={editContentDetailsRef} id="editContentDetails" label="Details" margin="normal" fullWidth multiline rows={7} /*value={editContentArray.editContentDetails} onChange={checkEditInput} */ InputLabelProps={{ shrink: editDialog && !loadingBackDrop }} autoFocus ></TextField>
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
                        {loadingBackDrop ?
                            <LoadingButton loading={true} variant="contained" >DELETE</LoadingButton> :
                            ( contentID !== null && <Button variant="contained" color="error" onClick={() => deleteContent(contentID)}>Delete</Button>)
                        }
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)}>Cancel </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
}

export default Home;
