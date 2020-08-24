// import fs from 'fs';
// import path from 'path';
// import {NodeIO, FileUtils} from '@gltf-transform/core';
const fs = require('fs');
const path = require('path');
const { NodeIO, FileUtils } = require('@gltf-transform/core');
const { colorspace } = require('@gltf-transform/lib');
let files = ['house', 'island', 'ship', 'tree', 'well'];
let pattern = [/House_\d+$/, /Island_\d+$/, /Ship_\d+$/ ,/LifeTree_\d+$/, /Well.+$/];
const FPS = 10;

// const INPUT_PATH = '/Users/torin/Documents/2020/QuantumSummer/static/models/house2/scene.gltf';
// const OUTPUT_PATH = '/Users/torin/Documents/2020/QuantumSummer/static/models/house2/scene.glb';
// const MESH_PATTERN = /House_\d+$/;
files.forEach((file, index ) => {
    let INPUT_PATH = `/Users/torin/Documents/2020/QuantumSummer/static/models/${file}/scene.gltf`;
    let OUTPUT_PATH = `/Users/torin/Documents/2020/QuantumSummer/static/models/${file}/scene.glb`;
    let MESH_PATTERN = pattern[index];


    const io = new NodeIO(fs, path);
    const doc = io.read(INPUT_PATH);
    const root = doc.getRoot();

    // Remove original animation data.
    root.listAnimations().forEach((anim) => {
        anim.listChannels().forEach((channel) => channel.dispose());
        anim.listSamplers().forEach((sampler) => sampler.dispose());
        anim.dispose();
    });
    root.listAccessors().forEach((accessor) => {
        if (accessor.listParents().length === 1) {
            accessor.dispose();
        }
    });

    // Collect house nodes.
    const houseNodes = root.listNodes()
        .filter((node) => node.getName().match(MESH_PATTERN));

    // Create animation cycling visibility of each mesh.
    const anim = doc.createAnimation();
    const animBuffer = root.listBuffers()[0]
        .setURI(FileUtils.basename(OUTPUT_PATH) + '.bin');
    houseNodes.forEach((node, i) => {
        // Create keyframe tracks that show each mesh for a single frame.
        let inputArray;
        let outputArray;
        if (i === 0) {
            inputArray = [i / FPS, (i + 1) / FPS];
            outputArray = [1,1,1, 0,0,0];
        } else if (i === houseNodes.length - 1) {
            inputArray = [(i - 1) / FPS, i / FPS];
            outputArray = [0,0,0, 1,1,1];
        } else {
            inputArray = [(i - 1) / FPS, i / FPS, (i + 1) / FPS];
            outputArray = [0,0,0, 1,1,1, 0,0,0];
        }

        // Construct glTF animation.
        const input = doc.createAccessor()
            .setArray(new Float32Array(inputArray))
            .setBuffer(animBuffer);
        const output = doc.createAccessor()
            .setArray(new Float32Array(outputArray))
            .setBuffer(animBuffer)
            .setType('VEC3');
        const sampler = doc.createAnimationSampler(node.getName())
            .setInterpolation('STEP')
            .setInput(input)
            .setOutput(output);
        const channel = doc.createAnimationChannel(node.getName())
            .setTargetNode(node)
            .setTargetPath('scale')
            .setSampler(sampler);
        anim.addSampler(sampler).addChannel(channel);
    });

    // io.write(OUTPUT_PATH, doc)
    doc.transform(colorspace({inputEncoding: 'sRGB'}))
        .then(() => io.write(OUTPUT_PATH, doc));

});