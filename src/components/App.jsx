import React, {useState} from 'react';
import ReactCrop from 'react-image-crop';
import "regenerator-runtime/runtime.js";
import Quagga from 'quagga';
import Tesseract from 'tesseract.js';

const App = () => {
    const [src, setSrc] = useState('');
    const [croppedImageUrl, setCroppedImageUrl] = useState('');
    const [imageRef, setImageRef] = useState('');
    const [barCode, setBarCode] = useState('');
    const [imageText, setImageText] = useState('');
    const [crop, setCrop] = useState({
        unit: '%',
        width: 50,
        height: 50,
    });

    let fileUrl = '';

    const onImageLoaded = image => {
        setImageRef(image);
    };

    const onCropComplete = async (crop) => {
        await makeClientCrop(crop);
    };

    const onCropChange = (cropVal) => {
        setCrop(cropVal);
    };

    const makeClientCrop = async (crop) => {
        if (imageRef && crop.width && crop.height) {
            const croppedImageUrl = await getCroppedImg(
                imageRef,
                crop,
                'newFile.jpeg'
            );
            setCroppedImageUrl(croppedImageUrl);
            Quagga.decodeSingle({
                decoder: {
                    readers: [
                        "code_128_reader"
                    ]
                },
                src: croppedImageUrl,
                numOfWorkers: 8,
                locator: {
                    patchSize: 'medium',
                    halfSample: false,
                },
                locate: true,
            }, function (result) {
                if (result && result.codeResult) {
                    setBarCode(result.codeResult.code)
                    console.log("result", result.codeResult.code);
                } else {
                    alert('No barcode detected, Please try again latter!')
                }
            });
            Tesseract.recognize(
                croppedImageUrl
            ).then(({data: {text}}) => {
                setImageText(text);
            })
        }
    }

    const getCroppedImg = (image, crop, fileName) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) {
                    //reject(new Error('Canvas is empty'));
                    console.error('Canvas is empty');
                    return;
                }
                blob.name = fileName;
                window.URL.revokeObjectURL(fileUrl);
                fileUrl = window.URL.createObjectURL(blob);
                resolve(fileUrl);
            }, 'image/jpeg');
        });
    }

    const onSelectFile = e => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setSrc(reader.result)
            );
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const acceptedTypes = [
        'image/png',
        'image/jpg',
        'image/jpeg',
    ];

    return (
        <>
            <div className="row main-div">
                <div className="col-sm-8">
                    {src &&
                    <ReactCrop
                        src={src}
                        crop={crop}
                        onImageLoaded={onImageLoaded}
                        onComplete={onCropComplete}
                        onChange={onCropChange}
                    />
                    }
                </div>
                <div className="col-sm-4">
                    <div className="details-items">
                        <input
                            type="file"
                            name="file"
                            id="file"
                            className="inputfile"
                            accept={acceptedTypes.toString()}
                            onChange={onSelectFile}/>
                        <label htmlFor="file">Choose a file</label>
                    </div>
                    <div>
                        <div>
                            <label>Detected Barcode</label>
                        </div>
                        <input value={barCode} type="text" name="barcode-number" id="barcode-number"
                               className="bar-code-number" disabled={true}/>
                    </div>
                    <div>
                        <div>
                            <label>Detected Text</label>
                        </div>
                        <input value={imageText} type="text" name="barcode-text" id="barcode-text"
                               className="bar-code-number" disabled={true}/>
                    </div>
                </div>
            </div>
        </>
    )
}

export default App
