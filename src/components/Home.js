/*React*/
import { useEffect, useState, useRef } from 'react';
/*Pages*/
import Header from './Header';
import '../index.css';
import { useAuth } from '../auth/AuthContext';
/*Material*/
import { TextField, Box, Grid, Container, Button, CssBaseline, Typography, CircularProgress, Backdrop, Alert, Card, IconButton, Slide, InputAdornment } from '@mui/material';
import { Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions } from '@mui/material';
import { addDoc, collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import MoreVert from '@mui/icons-material/MoreVert';
import Search from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEmotions from '@mui/icons-material/EmojiEmotions';
import HistoryIcon from '@mui/icons-material/History';
import { LoadingButton } from '@mui/lab';
import Content from './Content';
import { Visibility, VisibilityOff } from '@material-ui/icons';

const Home = () => {

    const currentUser = useAuth(); //Get currentUser details
    const { logout } = useAuth();
    const [userDetails, setUserDetails] = useState({ id: '', email: '', displayName: '', pinStatus: '', pin: '' }); //Set current User details
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
    const [searchedWord, setSearchedWord] = useState("");    // For search results count
    const [historyArray, setHistoryArray] = useState([]);   // For storing all details of past years of same date
    const [historyEachDayArray, setHistoryEachDayArray] = useState([]);   // For storing all details of past years of same date of all months
    const [showBox, setShowBox] = useState({yearWise: false, each: true})
    const [showHistory, setShowHistory] = useState(false);  // For toggling history div
    const allStateParams = { loading, searchLoading, anchorElNav, menuUsedArray, MoreVert, showEditContent, ellipsisUsedArray };
    const allSetStateParams = { setAnchorElNav, setMenuUsedArray, setLoadingBackdrop, setDeleteDialog, setContentID, setEllipsisUsedArray };
    const allParams = { ...allStateParams, ...allSetStateParams };
    const [pinInput, setPinInput] = useState({ pinMain: '', pinAlt: '' });    // Input Pin Fields
    const pinMainRef = useRef();
    const [pin, setPin] = useState('');               // Pin Input Errors
    const [pinError, setPinError] = useState('');               // Pin Input Errors
    const [showPin, setShowPin] = useState({ main: false, alt: false, loading: false });      // Pin Toggle
    const [resettingPin, setResettingPin] = useState(false);
    const PIN_KEY = process.env.REACT_APP_PIN_ENCRYPTION_KEY;
    const PIN_STRING = process.env.REACT_APP_SECRET_STRING;

    //Check for user details changes
    useEffect(() => {
        const authDetails = { email: currentUser.currentUser.email, displayName: currentUser.currentUser.displayName };
        
        const checkIsPinCreatedQuery = query(collection(getFirestore(), "users"), where("email", "==", currentUser.currentUser.email));
        onSnapshot(checkIsPinCreatedQuery, (snapshot) => {
            const pinDetails = snapshot.docs.map((doc) => ({ id: doc.id,email: doc.data().email, name: doc.data().name, pinStatus: doc.data().pinStatus ?? '', pin: doc.data().pin ?? '', }));
            setUserDetails({ ...authDetails, ...pinDetails[0] });
            setLoading(false);
        });
        return () => setUserDetails([]); //Cleanup function
    }, [currentUser.currentUser]);

    //Check if content data changes
    useEffect(() => {
        if (pin) {
            setLoading(true);
            //all contents query
            const allContentQuery = query(collection(getFirestore(), "contents"), where("email", "==", currentUser.currentUser.email), orderBy("contentDate", "desc"));
            onSnapshot(allContentQuery, (snapshot) => {
                setAllContentsArray(snapshot.docs.map((doc) => ({ id: doc.id, contentDate: doc.data().contentDate, contentTitle: doc.data().contentTitle, contentDetails: doc.data().contentDetails, })));
                setLoading(false);
            });
        }
        return setAllContentsArray([]); //Cleanup function
    }, [currentUser.currentUser.email, userDetails, pin]);

    //Optimized Search using debounce
    const searchDebouncer = (func, delay) => {
        let timer;  //Declaring a timer for maintaining and clearing onchange
        return function () {
            const context = this;
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(context);
            }, delay);
        }
    }
    const handleSearchDebounced = searchDebouncer(handleSearch, 500);

    // Get History Details
    useEffect(() => {
        let pastContents = [];
        pastContents = allContentsArray.filter((a) => {
            const dateParams = new Date().toISOString().split("T")[0].split("-");
            const itemParams = a.contentDate.split("-");
            // Return true if same day, month and not including current year
            return dateParams[1] === itemParams[1] && dateParams[2] === itemParams[2] && dateParams[0] !== itemParams[0]
        })
        let pastEachContents = [];
        pastEachContents = allContentsArray.filter((a) => {
            const dateParams = new Date().toISOString().split("T")[0].split("-");
            const itemParams = a.contentDate.split("-");
            // Return true if same day, month and not including current year
            return dateParams[2] === itemParams[2]
        })
        setHistoryEachDayArray(pastEachContents);
        setHistoryArray(pastContents);
        return () => {
            setHistoryArray([]);
            setHistoryEachDayArray([]);
        };
    }, [allContentsArray]);

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
        } else {
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
            setTimeout(() => { setAlert({ alertName: '', alertSeverity: '' }) }, 5000);
        } catch (e) {
            setLoadingBackdrop(false);
            setAlert({ alertName: 'Something went wrong! Error: ' + e, alertSeverity: 'error' });
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
                contentTitle: editContentTitleRef.current.value,
                contentDate: editContentDateRef.current.value,
                contentDetails: editContentDetailsRef.current.value
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

    // Input PIN onChange method
    const updatePin = (e) => {
        // if (e.target.name === "pinMain") {
        //     if (e.target.value.length === 6 && userDetails.pinStatus !== "") { 
        //         checkPin();
        //     }
        // }
          if (!isNaN(e.target.value))
            setPinInput({ ...pinInput, [e.target.name]: e.target.value });
    }
    
    // Encrypt Method
    const customEncrypt = (input, key, string) => {
        let finalEncString = '';
        for (let i = 0; i < 6; i++) {
            const num = input[i];
            const finalNum_digA = num + key + i;
            const finalNum_digB = num + key + i*2 + 4;
            const finalNum_digC = num + key + i*3 + 9;
            finalEncString += string[finalNum_digA % 29] ?? 'x';
            finalEncString += string[finalNum_digB % 29] ?? "x";
            finalEncString += string[finalNum_digC % 29] ?? "x";
        }
        return finalEncString;
    }

    // Check Pin from DB
    const checkPin = async () => {
        const myPin = pinMainRef.current.value;
        try {
            setShowPin({ ...showPin, loading: true });
            if (userDetails.pinStatus !== 'GEN') { 
                // New PIN to be created
                if (myPin === pinInput.pinAlt) {
                    setPinError("");

                    const encodedPin = customEncrypt(myPin, PIN_KEY, PIN_STRING);
                    
                    // Add PIN to Database
                    const updateItem = doc(getFirestore(), "users", userDetails.id);
                    await updateDoc(updateItem, { pinStatus: 'GEN', pin: encodedPin });
                    setShowPin({ ...showPin, loading: false });
                } else {
                    setPinError("PIN and confirm PIN are not the same!");
                    setShowPin({ ...showPin, loading: false });
                }
            } else {
                // Check PIN from Database
                const pinFromDB = userDetails.pin;

                const encodedPin = customEncrypt(myPin, PIN_KEY, PIN_STRING);

                if (pinFromDB === encodedPin) 
                    setPin(myPin);
                else setPinError("PIN is incorrect!");
            }
        } catch (e) {
            console.log('Something went wrong! Details: ', e);
            setPinError("Something went wrong!");
            setShowPin({ ...showPin, loading: false });
        }
    }
    
    // Forgot Pin
    const forgotPin = async () => {
        try {
            // Reset PIN to empty in Database
            const updateItem = doc(getFirestore(), "users", userDetails.id);
            await updateDoc(updateItem, { pinStatus: "", pin: "" });
            await logout();
        } catch (e) {
            console.log("Something went wrong! Details: ", e);  
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
                {/*Pin Dialog*/}
                <Dialog open={!pin} onClose={() => setEditDialog(false)} fullWidth maxWidth='sm' >
                    {userDetails.pinStatus === '' ? <DialogTitle>Create a new PIN!</DialogTitle> : <DialogTitle>Confirm it's you!</DialogTitle>}
                    <DialogContent>
                        {userDetails.pinStatus === '' ?
                            <DialogContentText>
                                <DialogContentText>
                                    {loading ? "Initializing security protocols..." : "PIN not found for this account. Create a new PIN to secure your Diary."}
                                    {loading && <CircularProgress size={24} sx={{ verticalAlign: 'middle', marginLeft: '8px' }} />}
                                </DialogContentText>
                            </DialogContentText> : 
                            <DialogContentText>
                                Enter your PIN to load your content securely:<br />
                            </DialogContentText>
                        }
                        <TextField margin="normal" required fullWidth id="pinInput" label="PIN" inputRef={pinMainRef} name="pinMain" autoComplete="off" value={pinInput.pinMain} error={!!pinError} helperText={pinError} onChange={updatePin} type={showPin.main ? "text" : "password"} autoFocus="true"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton aria-label="toggle pin visibility" onClick={() => { setShowPin({...showPin, main: !showPin.main}) }} onMouseDown={() => { setShowPin({...showPin, main: !showPin.main}) }}>
                                            {showPin.main ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            inputProps={{inputMode: 'numeric', maxLength: 6}}
                        />
                        {userDetails.pinStatus === '' &&
                            // <TextField margin="normal" required fullWidth id="pinAltInput" label="Confirm PIN" name="pinAlt" autoComplete="off" value={pinInput.pinAlt} onChange={updatePin} type="password"
                            //     inputProps={{inputMode: 'numeric', maxLength: 6}}
                            // />
                            <TextField margin="normal" required fullWidth id="pinAltInput" label="Confirm PIN" name="pinAlt" autoComplete="new-password" value={pinInput.pinAlt} error={!!pinError} onChange={updatePin} type={showPin.alt ? "text" : "password"}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton aria-label="toggle pin visibility" onClick={() => { setShowPin({...showPin, alt: !showPin.alt}) }} onMouseDown={() => { setShowPin({...showPin, alt: !showPin}) }}>
                                            {showPin.alt ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            inputProps={{inputMode: 'numeric', maxLength: 6}}
                        />
                        }
                    </DialogContent>
                    <DialogActions sx={{ pb: 2 }}>
                        <Button variant="contained" color="success" disabled={ userDetails.pinStatus !== 'GEN' ? !(pinInput?.pinMain && pinInput?.pinAlt) : !pinInput.pinMain } onClick={() => checkPin()}>CONFIRM</Button>
                        <Button variant="outlined" color="error" onClick={() => setResettingPin(true)}>FORGET PIN</Button>
                    </DialogActions>
                    {resettingPin && <DialogContent>
                        <DialogContentText>
                            To Reset your PIN, you need to LOGOUT and LOGIN through here:
                        </DialogContentText><br/>
                        <Button variant="contained" color="error" onClick={() => forgotPin()}>RESET</Button>{" "}
                        <Button variant="outlined" color="secondary" onClick={() => setResettingPin(false)}>CANCEL</Button>
                    </DialogContent>}
                </Dialog>
                {/*Add Content*/}
                <Card raised={true} sx={{ bgcolor: 'teal[50]', mt: 2, px: 2, py: 3 }} ref={addContentFormRef}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Grid container alignItems="center">
                            <Grid item><IconButton><EmojiEmotions fontSize="large" color="success" /></IconButton></Grid>
                            <Grid item><Typography id="welcomeName" variant="h5">Hello {userDetails.displayName}!</Typography></Grid>
                        </Grid>
                        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                            {
                                (historyArray.length > 0 || historyEachDayArray.length > 0) &&
                                <Box><IconButton onClick={() => { setShowHistory(!showHistory); setSearchBox(false); setSearchedWord("") }}><HistoryIcon /></IconButton></Box>
                            }
                            {
                                searchBox ?
                                    <Box><IconButton onClick={() => { setSearchBox(false); }}><CancelIcon /></IconButton></Box> :
                                    <Box><IconButton onClick={() => { setSearchBox(!searchBox); setSearchedWord(""); setShowHistory(false); }}><Search /></IconButton></Box>
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
                                <TextField id="contentTitle" inputRef={contentTitleRef} required label="Title for this day" /*value={content.contentTitle} onChange={handleChange}*/ error={addContentErrors.contentTitle !== ''} helperText={addContentErrors.contentTitle === '' ? '' : addContentErrors.contentTitle} /><br /><br />
                                <Button variant="contained" sx={{ mr: 1 }} onClick={(e) => { addContent(e) }}>ADD</Button>
                                <Button variant="outlined" color="error" onClick={() => setShowAddContent(false)}>CLOSE</Button>
                            </div>
                        </Slide>
                    }
                    {
                        showHistory && !searchBox &&
                        <Slide in={showHistory} direction="up" container={addContentFormRef.current}>
                            <div>
                                {
                                    (historyArray.length > 0) &&
                                    <>
                                        <br />
                                        <div display="flex">
                                            <div><Typography id="historyTitle" variant="h6">Your past notes on this day on previous years..</Typography></div>
                                            <Button variant='contained' color='info' onClick={(prev) => setShowBox({ ...prev, yearWise: !showBox.yearWise })}>{showBox.yearWise ? 'HIDE' : 'SHOW'}</Button>
                                        </div>
                                        {showBox.yearWise && historyArray.map((item) => (
                                            <Content key={item.id} item={item} allParams={allParams} type="subType" />
                                        ))}
                                    </>
                                }
                                {
                                    (historyEachDayArray.length > 0) &&
                                    <>
                                        <br />
                                        <div display="flex">
                                            <div><Typography id="historyTitle" variant="h6">Your past notes on this day on previous months..</Typography></div>
                                            <Button variant='contained' color='info' onClick={(prev)=>setShowBox({...prev, each: !showBox.each})}>{showBox.each ? 'HIDE' : 'SHOW'}</Button>
                                        </div>
                                        {showBox.each && historyEachDayArray.map((item) => (
                                            <Content key={item.id} item={item} allParams={allParams} type="subType" />
                                        ))}
                                    </>
                                }
                                <br />
                                <Button variant="contained" color="error" onClick={() => { setShowHistory(false); setSearchBox(false); setSearchedWord("") }}>CLOSE</Button>
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
                            searchBox && searchedWord !== "" &&
                            (filteredContentArray.length > 0) &&
                            filteredContentArray.map((item) => (
                                <Content key={item.id} item={item} allParams={allParams} type="subType" />
                            ))
                    }
                </Box>
                {/*Show Content*/}
                <Box sx={{ py: 3 }}>
                    {
                        loading ? <CircularProgress /> :
                            (allContentsArray.length > 0) ?
                                allContentsArray.map((data) => (
                                    <Content key={data.id} item={data} allParams={allParams} type="mainType" />
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
                            (contentID !== null && <Button variant="contained" color="error" onClick={() => deleteContent(contentID)}>Delete</Button>)
                        }
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)}>Cancel </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
}

export default Home;